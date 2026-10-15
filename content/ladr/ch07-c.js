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

/** A little house (outline, door, window) for pictures of linear maps of the plane. */
const HOUSE = [[-0.5, -0.55], [0.5, -0.55], [0.5, 0.15], [0, 0.62], [-0.5, 0.15]];
const DOOR = [[-0.16, -0.55], [0.08, -0.55], [0.08, -0.14], [-0.16, -0.14]];
const WIN = [[0.2, -0.06], [0.38, -0.06], [0.38, 0.13], [0.2, 0.13]];

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
function plaid(x, y) { // an exact rank-3 tartan: (0.18 + 0.3 u(y))·1 + 1·0.3 w(x) + 0.22 u₂(y) w₂(x)
  const band = (t, p, w) => { const r = (((t % p) + p) % p) - p / 2; return Math.exp(-(r * r) / (2 * w * w)); };
  return 0.18 + 0.3 * band(y, 20, 4.5) + 0.3 * band(x, 20, 4.5) + 0.22 * band(y + 5, 10, 1.3) * band(x + 5, 10, 1.3);
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
    // ------------------------------------------------------------------ 7.68
    {
      num: '7.68',
      kind: 'Theorem',
      name: 'Role of positive singular values',
      statement: String.raw`Suppose $T \in \mathcal L(V, W)$. Then
(a) $T$ is injective $\iff$ $0$ is not a singular value of $T$;
(b) the number of positive singular values of $T$ equals $\dim \operatorname{range} T$;
(c) $T$ is surjective $\iff$ the number of positive singular values of $T$ equals $\dim W$.`,
      idea: String.raw`(a) $T$ is injective $\iff \operatorname{null} T = \{0\} \iff \operatorname{null} T^*T = \{0\}$ (7.64(b)) $\iff 0$ is not an eigenvalue of $T^*T \iff 0$ is not a singular value. (b) The spectral theorem (7.29, 7.31) diagonalizes $T^*T$ in an orthonormal basis, so $\dim \operatorname{range} T^*T$ is the number of positive eigenvalues counted with multiplicity — the number of positive singular values — and 7.64(d) says this is $\dim \operatorname{range} T$. (c) $T$ is surjective exactly when $\dim \operatorname{range} T = \dim W$ (2.39).`,
      caption: String.raw`Pick the shape of $T$. The 3D view (drag the background to rotate) shows the image of the unit sphere of $V$ inside $W$ — an ellipsoid, a flat ellipse or a segment — with its semi-axes $s_k f_k$. Slide columns into the span of the others: singular values drop to $0$ one at a time (bars, right) and the image loses a dimension each time. The number of positive bars always equals $\dim \operatorname{range} T$, computed independently by row reduction. Injectivity needs all $\dim V$ bars positive; surjectivity needs $\dim W$ of them — impossible for $\mathbf R^2 \to \mathbf R^3$, and injectivity is impossible for $\mathbf R^3 \to \mathbf R^2$.`,
      deps: ['ladr-7.65', 'ladr-7.64', 'ladr-7.29', 'ladr-7.31', 'ladr-2.39'],
      tags: ['singular values'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-1.8, 1.8], y: [-1.6, 1.9], equal: true, axes: false, height: 380, weight: 1.3, minWidth: 320, title: 'in $W$: the image of the unit sphere of $V$' });
        const B = v.stage({ x: [0.3, 3.7], y: [0, 2], height: 380, minWidth: 240, axes: false, title: 'the singular values of $T$' });
        const sc = v.scene3(S, { yaw: -0.75, pitch: 0.32, axis: 1.45, lim: 1.6 });
        const shape = v.select('', [{ value: '33', label: '$\\mathbf R^3 \\to \\mathbf R^3$' }, { value: '32', label: '$\\mathbf R^2 \\to \\mathbf R^3$' }, { value: '23', label: '$\\mathbf R^3 \\to \\mathbf R^2$' }], '33', { onChange: (k) => { sc.pitch = k === '23' ? 0.95 : 0.32; } });
        const t1 = v.slider('collapse a column', 0, 1, 0.35, { step: 0.01 });
        const t2 = v.slider('collapse another', 0, 1, 0, { step: 0.01 });
        const C = { 33: [[1.2, 0.25, -0.15], [0.05, 1.0, 0.3], [-0.25, 0.1, 1.0]], 32: [[1.15, 0.3, -0.1], [-0.2, 0.8, 0.55]], 23: [[1.15, 0.3], [-0.4, 0.9], [0.5, 0.6]] };
        const Tof = () => {
          const k = shape.value, c = C[k].map((x) => x.slice()), a = t1.value, b = t2.value;
          if (k === '33') { c[1] = add(c[1], scl(sub(scl(c[0], 0.8), c[1]), b)); c[2] = add(c[2], scl(sub(add(scl(c[0], 0.5), scl(c[1], -0.4)), c[2]), a)); }
          else if (k === '32') c[1] = add(c[1], scl(sub(scl(c[0], -0.6), c[1]), a));
          else { c[1] = add(c[1], scl(sub(scl(c[0], -0.6), c[1]), a)); c[2] = add(c[2], scl(sub(scl(c[0], 0.7), c[2]), a)); }
          return fromCols(c);
        };
        const AC = ['blue', 'purple', 'teal'];
        let st = null;
        v.render(() => {
          const k = shape.value; t2.el.hidden = k !== '33';
          const T = Tof(), m = T.length, n = T[0].length, emb = (w) => (w.length === 3 ? w : [w[0], w[1], 0]);
          const sing = M.eigSym(mm(tr(T), T)).values.map((x) => Math.sqrt(Math.max(0, x)));
          const tol = 1e-6 * Math.max(1, sing[0]), pos = sing.filter((x) => x > tol).length;
          const rk = M.rref(T, 1e-9).pivots.length, sv = M.svd(T);
          const ax = sv.S.map((x, i) => emb(scl(sv.U.map((r) => r[i]), x > tol ? x : 0)));
          sc.begin();
          if (m === 2) { sc.disc([1, 0, 0], [0, 1, 0], 1.55, { fill: 'muted', color: 'muted', fillAlpha: 0.04, alpha: 0.4 }); sc.tex('W = \\mathbf R^2', [1.3, -1.1, 0], { color: 'muted', size: 13 }); }
          if (n === 3) {
            sphereImage(sc, T, { color: 'accent', width: 1, alpha: 0.35 });
            const pairs = m === 3 ? [[0, 1], [0, 2], [1, 2]] : [[0, 1]];
            for (const [i, j] of pairs) ellPoly3(sc, ax[i], ax[j], { fill: 'accent', color: 'accent', fillAlpha: 0.09, alpha: 0.5, width: 1.2 });
          } else ellPoly3(sc, ax[0], ax[1], { fill: 'accent', color: 'accent', fillAlpha: 0.16, alpha: 0.8, width: 1.6 });
          ax.forEach((a, i) => { if (len(a) > 1e-6) { sc.arrow(ZERO, a, { color: AC[i], width: 3 }); sc.tex(`s_${i + 1}f_${i + 1}`, scl(a, 1.18), { color: AC[i], size: 14 }); } });
          sc.flush();
          const dimNames = ['a point', 'a segment', 'a flat ellipse', 'an ellipsoid'];
          S.corner(`image: ${dimNames[pos]} (dimension ${pos})`, 'tl', { color: 'muted', weight: 600 });
          // the bars
          const ymax = Math.max(1.2, sing[0] * 1.2);
          B.setView([0.3, n + 0.7], [-0.62 * ymax, 1.12 * ymax]);
          B.line(0.4, 0, n + 0.6, 0, { color: 'muted', width: 1 });
          sing.forEach((x, i) => {
            const ok = x > tol, c = ok ? 'green' : 'red';
            if (ok) B.rect(i + 0.72, 0, i + 1.28, x, { fill: c, fillAlpha: 0.5, color: c, width: 1.2 });
            else B.dot(i + 1, 0, { color: 'red', r: 6 });
            B.text(`s${'₁₂₃'[i]} = ${pf(ok ? x : 0)}`, i + 1, ok ? x : 0, { align: 'center', dy: -12, size: 12, color: c, weight: 600 });
          });
          const inj = pos === n, sur = pos === m;
          const ln = (y, txt, good) => B.text(txt, n / 2 + 0.5, -y * ymax, { align: 'center', size: 12.5, color: good == null ? 'ink' : good ? 'green' : 'red', weight: good == null ? 500 : 700 });
          ln(0.12, `${pos} positive  =  dim range T = ${rk} (row reduction)`, null);
          ln(0.27, `injective: ${inj ? 'yes — no zero singular value' : 'no — 0 is a singular value'}`, inj);
          ln(0.42, `surjective: ${sur ? `yes — ${pos} = dim W` : `no — ${pos} < dim W = ${m}`}`, sur);
          st = { T, sing, pos, rk, n, m, inj, sur, nul: M.nullspace(T, 1e-9).length };
        });
        v.legend([['accent', '$T(\\text{unit sphere})$', { area: true }], ['green', 'positive singular value', { area: true }], ['red', 'singular value $0$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { T, sing, pos, rk, n, m, inj, sur, nul } = st;
          return `$T = ${mtex(T)}$ has $\\dim V = ${n}$ singular values $${sing.map((x) => tn(x > 1e-6 * Math.max(1, sing[0]) ? x : 0)).join(', ')}$. (a) $\\dim\\operatorname{null} T = ${nul}$: ${inj ? '**injective**, and $0$ is not a singular value' : '**not injective**, and $0$ is a singular value'}. (b) ${pos} positive $= \\dim\\operatorname{range} T = ${rk}$. (c) $\\dim W = ${m}$: ${sur ? '**surjective**' : '**not surjective**'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.69
    {
      num: '7.69',
      kind: 'Theorem',
      name: 'Isometry ⟺ all singular values equal 1',
      statement: String.raw`Suppose $S \in \mathcal L(V, W)$. Then
$$S \text{ is an isometry} \iff \text{all singular values of } S \text{ equal } 1.$$`,
      idea: String.raw`By 7.49, $S$ is an isometry if and only if $S^*S = I$. The operator $S^*S$ is self-adjoint, so by the spectral theorem (7.29, 7.31) it is diagonal in some orthonormal basis; hence $S^*S = I$ exactly when all its eigenvalues equal $1$, which (taking square roots) means all singular values of $S$ equal $1$. Eigenvalues of $S$ itself cannot detect this: a shear has both eigenvalues equal to $1$ and still stretches some vectors.`,
      caption: String.raw`Drag $S(1,0)$ and $S(0,1)$; they snap to length $1$ and to right angles. Left: a house and the unit circle (dashed) with their images under $S$; drag the gold $v$ to compare $\|Sv\|$ with $\|v\|$. Right: the stretch factor $\|Su\|$ for every unit vector $u$, drawn as a polar curve; it touches the circles of radius $s_1$ (along $e_1$) and $s_2$ (along $e_2$). Lengths are preserved exactly when this curve is the unit circle — when $s_1 = s_2 = 1$. Try the shear: eigenvalues $1, 1$, but not an isometry.`,
      deps: ['ladr-7.49', 'ladr-7.29', 'ladr-7.31', 'ladr-7.65'],
      tags: ['singular values', 'isometries'],
      viz(v) {
        const S = v.stage({ x: [-2.3, 2.3], y: [-2.1, 2.3], equal: true, height: 360, minWidth: 290, weight: 1.1 });
        const P = v.stage({ x: [-2.1, 2.1], y: [-2.1, 2.1], equal: true, height: 360, minWidth: 260, axes: false, title: 'stretch factor $\\|Su\\|$ in each direction $u$' });
        const PRE = { rot: rot(0.6), ref: mm(rot(0.6), [[1, 0], [0, -1]]), shear: [[1, 0.8], [0, 1]], half: mm(rot(0.6), [[1, 0], [0, 0.6]]), small: scl(rot(0.6).flat(), 0.8) };
        PRE.small = [PRE.small.slice(0, 2), PRE.small.slice(2)];
        const snapC = (other) => (x, y) => {
          let p = [x, y]; const o = other();
          if (len(o) > 0.2 && Math.abs(dot(unit(p), unit(o))) < 0.07) p = sub(p, scl(unit(o), dot(p, unit(o))));
          const L = len(p); if (L > 0 && Math.abs(L - 1) < 0.07) p = scl(p, 1 / L);
          return p;
        };
        const H = colHandles(S, PRE.half, { l1: 'S(1,0)', l2: 'S(0,1)', c1: snapC(() => [H.h2.x, H.h2.y]), c2: snapC(() => [H.h1.x, H.h1.y]) });
        v.select('', [{ value: 'rot', label: 'rotation' }, { value: 'ref', label: 'reflection' }, { value: 'shear', label: 'shear' }, { value: 'half', label: 'one axis × 0.6' }, { value: 'small', label: '0.8 × rotation' }], 'half', { onChange: (k) => H.set(PRE[k]) });
        const vh = S.handle(-1.35, -1.0, { color: 'gold', label: 'v' });
        let st = null;
        v.render(() => {
          const A = H.A, { s, e } = svd22(A), iso = Math.abs(s[0] - 1) < 1e-6 && Math.abs(s[1] - 1) < 1e-6, col = iso ? 'green' : 'orange';
          for (let i = -3; i <= 3; i++) {
            const a = mv(A, [i, -3]), b = mv(A, [i, 3]), c = mv(A, [-3, i]), d = mv(A, [3, i]);
            S.line(a[0], a[1], b[0], b[1], { color: col, width: 1, alpha: 0.2 }); S.line(c[0], c[1], d[0], d[1], { color: col, width: 1, alpha: 0.2 });
          }
          S.circle(0, 0, 1, { color: 'muted', dash: [4, 4], width: 1 });
          S.path(ellPts(A), { color: iso ? 'green' : 'accent', width: 1.6 });
          for (const sh of [HOUSE, DOOR, WIN]) {
            S.poly(sh, { color: 'muted', dash: [3, 3], width: 1 });
            S.poly(sh.map((p) => mv(A, p)), { fill: col, fillAlpha: 0.16, color: col, width: 1.6 });
          }
          const vv = [vh.x, vh.y], Sv = mv(A, vv);
          S.circle(0, 0, len(vv), { color: 'gold', width: 1, dash: [2, 4], alpha: 0.8 });
          S.arrow(0, 0, vv[0], vv[1], { color: 'gold', width: 2.4 });
          S.arrow(0, 0, Sv[0], Sv[1], { color: 'purple', width: 2.6 });
          S.tex('Sv', Sv[0], Sv[1], { color: 'purple', size: 15, dx: 13, dy: -10 });
          S.corner(iso ? 'S preserves lengths: an isometry' : 'S changes some lengths', 'tl', { color: iso ? 'green' : 'red', weight: 700 });
          // the stretch profile
          P.circle(0, 0, 1, { color: 'green', width: 1.6, alpha: 0.8 });
          P.circle(0, 0, s[0], { color: 'blue', width: 1.2, dash: [6, 4] });
          if (s[1] > 0.02) P.circle(0, 0, s[1], { color: 'purple', width: 1.2, dash: [6, 4] });
          const prof = []; for (let k = 0; k <= 360; k++) { const u = uAt((TAU * k) / 360); prof.push(scl(u, len(mv(A, u)))); }
          P.path(prof, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 2.4 });
          for (const [k, c] of [[0, 'blue'], [1, 'purple']]) {
            const u = e[k];
            P.line(-2.1 * u[0], -2.1 * u[1], 2.1 * u[0], 2.1 * u[1], { color: c, width: 1, alpha: 0.35 });
            for (const sg of [1, -1]) P.dot(sg * s[k] * u[0], sg * s[k] * u[1], { color: c, r: 4.5 });
            const lp = scl(u, Math.max(s[0], 1) + 0.38);
            P.tex(`s_${k + 1} = ${tn(s[k])}`, lp[0], lp[1], { color: c, size: 14 });
          }
          P.text('unit circle', 0, -1, { color: 'green', size: 11, dy: 12, align: 'center' });
          st = { A, s, iso, nv: len(vv), nSv: len(Sv), ev: v.M.eig2(A) };
        });
        v.legend([['accent', 'the stretch profile $u \\mapsto \\|Su\\|\\,u$', { area: true }], ['blue', 'radius $s_1$', { dash: true }], ['purple', 'radius $s_2$', { dash: true }], ['green', 'radius $1$']]);
        v.readout(() => {
          if (!st) return '';
          const { A, s, iso, nv, nSv, ev } = st, StS = mm(tr(A), A);
          const evs = ev.map(([re, im]) => (Math.abs(im) < 1e-9 ? tn(re) : `${tn(re)} ${im > 0 ? '+' : '-'} ${tn(Math.abs(im))}i`)).join(', ');
          return `$S^*S = ${mtex(StS)}$, singular values $${tn(s[0], 3)}, ${tn(s[1], 3)}$; $\\|v\\| = ${tn(nv)}$, $\\|Sv\\| = ${tn(nSv)}$ — ${iso ? '$S^*S = I$: **an isometry**' : '**not an isometry**'}. Eigenvalues of $S$: $${evs}$${!iso && ev.every(([re, im]) => Math.abs(Math.hypot(re, im) - 1) < 1e-6) ? ' — all of absolute value $1$, yet $S$ is no isometry' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.70
    {
      num: '7.70',
      kind: 'Theorem',
      name: 'Singular value decomposition',
      statement: String.raw`Suppose $T \in \mathcal L(V, W)$ and the positive singular values of $T$ are $s_1, \dots, s_m$. Then there exist orthonormal lists $e_1, \dots, e_m$ in $V$ and $f_1, \dots, f_m$ in $W$ such that
$$Tv = s_1\langle v, e_1\rangle f_1 + \cdots + s_m\langle v, e_m\rangle f_m$$
for every $v \in V$.`,
      idea: String.raw`$T^*T$ is a positive operator (7.64), so the spectral theorem (7.29, 7.31) gives an orthonormal basis $e_1, \dots, e_n$ of $V$ with $T^*Te_k = s_k^2 e_k$. For $k \le m$ put $f_k = Te_k / s_k$; then $\langle f_j, f_k\rangle = \langle e_j, T^*Te_k\rangle / (s_j s_k) = \langle e_j, e_k\rangle$, so the $f_k$ are orthonormal. For $k > m$, $T^*Te_k = 0$ forces $Te_k = 0$ (7.64(b)). Now expand $v = \sum_k \langle v, e_k\rangle e_k$ (6.30) and apply $T$. In the plane this says that every linear map is a rotation (reading off the coordinates $\langle v, e_k\rangle$), a stretch along perpendicular axes, and a second rotation (placing the results along the $f_k$).`,
      caption: String.raw`Drag the targets $T(1,0)$ and $T(0,1)$ to choose $T$, then watch: the plane (grid, unit circle, face) is first turned so that $e_1, e_2$ lie along the axes, then stretched by $s_1, s_2$ along those axes (with a flip when $\det T < 0$), then turned so that the axes land on $f_1, f_2$. The motion ends exactly on $T$ applied to the picture: the dashed target ellipse is $T(\text{unit circle})$, and $e_k$ arrives at $s_k f_k = Te_k$. Click the timeline to jump to any moment.`,
      deps: ['ladr-7.65', 'ladr-7.64', 'ladr-7.29', 'ladr-7.31', 'ladr-6.30'],
      tags: ['singular values', 'factorization'],
      credit: 'Beltrami, 1873; Jordan, 1874',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Singular_value_decomposition' },
      viz(v) {
        const S = v.stage({ x: [-3, 3], y: [-2.5, 2.5], equal: true, height: 400, full: true });
        const TL = v.stage({ x: [0, 10], y: [0, 1], height: 58, full: true, axes: false });
        const H = colHandles(S, [[0.4, 1.3], [-1.4, -0.7]]);
        const PH = [[1, 3], [3.5, 5.5], [6, 8]], PL = ['1 · rotate e₁, e₂ onto the axes', '2 · stretch by s₁, s₂', '3 · rotate the axes onto f₁, f₂'], PC = ['blue', 'orange', 'purple'];
        TL.onClick((x) => { v.pause(); v.t = Math.max(0, Math.min(9.99, x)); });
        const EYES = [[-0.36, 0.3], [0.36, 0.3]], MOUTH = Array.from({ length: 25 }, (_, i) => scl(uAt(Math.PI * (1.15 + (0.7 * i) / 24)), 0.55));
        let st = null;
        v.animate((t) => {
          const T = H.A, { s, e, f, det } = svd22(T);
          const al = Math.atan2(e[0][1], e[0][0]), be = Math.atan2(f[0][1], f[0][0]), sg2 = s[1] * (dot(f[1], perp(f[0])) < 0 ? -1 : 1);
          const u1 = smooth((t - 1) / 2), u2 = smooth((t - 3.5) / 2), u3 = smooth((t - 6) / 2);
          const L = mm(rot(be * u3), mm([[1 + (s[0] - 1) * u2, 0], [0, 1 + (sg2 - 1) * u2]], rot(-al * u1)));
          const P = (p) => mv(L, p);
          for (let i = -5; i <= 5; i++) {
            const a = P([i, -5]), b = P([i, 5]), c = P([-5, i]), d = P([5, i]);
            S.line(a[0], a[1], b[0], b[1], { color: 'accent', width: i ? 1 : 1.6, alpha: i ? 0.14 : 0.3 });
            S.line(c[0], c[1], d[0], d[1], { color: 'accent', width: i ? 1 : 1.6, alpha: i ? 0.14 : 0.3 });
          }
          S.path(ellPts(T), { color: 'muted', width: 1.3, dash: [6, 4] });
          S.path(ellPts(L), { fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 2 });
          for (const c of EYES) S.path(Array.from({ length: 25 }, (_, i) => P(add(c, scl(uAt((TAU * i) / 24), 0.1)))), { fill: 'ink', fillAlpha: 0.55, stroke: false });
          S.path(MOUTH.map(P), { color: 'ink', width: 2.4, alpha: 0.7 });
          const phase = t < 3.25 ? 0 : t < 5.75 ? 1 : 2;
          e.forEach((u, k) => {
            const c = k ? 'purple' : 'blue', w = P(u);
            S.arrow(0, 0, w[0], w[1], { color: c, width: 3.2 });
            const lab = phase === 0 ? `e_${k + 1}` : phase === 1 ? `${tn(k ? 1 + (sg2 - 1) * u2 : 1 + (s[0] - 1) * u2)}\\,${k ? '(0,1)' : '(1,0)'}` : `s_${k + 1} f_${k + 1}`;
            const lp = len(w) > 0.05 ? add(w, scl(unit(w), 0.32)) : [0.3, k ? 0.3 : -0.3];
            S.tex(lab, lp[0], lp[1], { color: c, size: 15 });
          });
          S.corner(t < 1 ? 'the unit circle with the right singular vectors e₁, e₂' : t < 8.2 ? PL[Math.min(2, Math.max(0, PH.findIndex(([a, b]) => t < b + 0.25)))] : 'done: the picture is now T(picture)', 'tl', { color: 'muted', weight: 600 });
          if (det < 0 && t > 3.5 && t < 6) S.corner('det T < 0: the stretch includes a flip', 'tr', { color: 'orange', weight: 600 });
          // timeline
          TL.rect(0, 0.28, 10, 0.72, { fill: 'faint', fillAlpha: 0.12, stroke: false });
          PH.forEach(([a, b], i) => { TL.rect(a, 0.28, b, 0.72, { fill: PC[i], fillAlpha: 0.22, stroke: false }); TL.text(PL[i], (a + b) / 2, 0.5, { align: 'center', size: 11.5, color: 'ink' }); });
          TL.line(t, 0.08, t, 0.92, { color: 'gold', width: 3 });
          let err = 0; for (let k = 0; k < 24; k++) { const x = uAt((TAU * k) / 24), Tx = mv(T, x), rhs = add(scl(f[0], s[0] * dot(x, e[0])), scl(f[1], s[1] * dot(x, e[1]))); err = Math.max(err, len(sub(Tx, rhs))); }
          const Lend = mm(rot(be), mm([[s[0], 0], [0, sg2]], rot(-al)));
          st = { T, s, e, f, err, err2: maxAbs(msub(Lend, T)) };
        }, { period: 10, still: 4.6 });
        v.legend([['blue', '$e_1 \\to s_1 f_1$'], ['purple', '$e_2 \\to s_2 f_2$'], ['muted', 'target $T(\\text{unit circle})$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { T, s, e, f, err, err2 } = st;
          return `$T = ${mtex(T)}$: $s_1 = ${tn(s[0])}$, $s_2 = ${tn(s[1])}$, $e_1 = ${vtex(e[0])}$, $e_2 = ${vtex(e[1])}$, $f_1 = ${vtex(f[0])}$, $f_2 = ${vtex(f[1])}$. Check: $\\max_{\\|v\\|=1}\\|Tv - \\sum_k s_k\\langle v, e_k\\rangle f_k\\| = ${v.sci(err, 1)}$, and rotate∘stretch∘rotate differs from $T$ by $${v.sci(err2, 1)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.75
    {
      num: '7.75',
      kind: 'Theorem',
      name: 'SVD of the adjoint and the pseudoinverse',
      statement: String.raw`Suppose $T \in \mathcal L(V, W)$ has positive singular values $s_1, \dots, s_m$, and $e_1, \dots, e_m$ and $f_1, \dots, f_m$ are orthonormal lists in $V$ and $W$ with
$$Tv = s_1\langle v, e_1\rangle f_1 + \cdots + s_m\langle v, e_m\rangle f_m \quad\text{for all } v \in V.$$
Then for every $w \in W$
$$T^*w = s_1\langle w, f_1\rangle e_1 + \cdots + s_m\langle w, f_m\rangle e_m \quad\text{and}\quad T^\dagger w = \frac{\langle w, f_1\rangle}{s_1}e_1 + \cdots + \frac{\langle w, f_m\rangle}{s_m}e_m.$$`,
      idea: String.raw`For the adjoint, expand: $\langle Tv, w\rangle = \sum_k s_k\langle v, e_k\rangle\langle f_k, w\rangle = \big\langle v, \sum_k s_k\langle w, f_k\rangle e_k\big\rangle$, and the adjoint is the unique map with this property (7.1). For the pseudoinverse, call the right side $v$. Then $Tv = \sum_k \langle w, f_k\rangle f_k$, which is $P_{\operatorname{range} T} w$ because $f_1, \dots, f_m$ is an orthonormal basis of $\operatorname{range} T$ (6.57); and $v$ lies in $\operatorname{span}(e_1, \dots, e_m) = (\operatorname{null} T)^\perp$. Those two properties define $T^\dagger w$ (6.68). So: swap the roles of the $e$'s and $f$'s to get $T^*$; swap and invert the $s_k$ to get $T^\dagger$.`,
      caption: String.raw`Drag $T(1,0)$, $T(0,1)$ (in $W$; $T(0,1)$ snaps onto the line of $T(1,0)$ to make rank $1$) and the gold $w$. In $W$, $w$ is split along the orthonormal $f_1, f_2$; in $V$ the same coefficients, multiplied by $s_k$ (for $T^*$) or divided by $s_k$ (for $T^\dagger$), are laid along $e_1, e_2$ tip to tail. The result lands inside the ring computed directly — as the transpose matrix, or as the pseudoinverse matrix. For $T^\dagger$ the green arrow in $W$ is $TT^\dagger w = P_{\operatorname{range} T} w$; with rank $1$, $T^\dagger w$ is the shortest of all the least-squares solutions (dashed line). Move towards rank $1$ without snapping and watch $T^\dagger w$ run away as $1/s_2$ blows up.`,
      deps: ['ladr-7.70', 'ladr-7.1', 'ladr-6.68', 'ladr-6.57'],
      tags: ['singular values', 'pseudoinverse'],
      viz(v) {
        const M = v.M;
        const V = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, height: 360, minWidth: 280, title: 'in $V$: $T^*w$ or $T^\\dagger w$' });
        const W = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, height: 360, minWidth: 280, title: 'in $W$: $w$ and the $f_k$' });
        const which = v.select('', [{ value: 'adj', label: '$T^*$: swap $e_k$ and $f_k$' }, { value: 'pinv', label: '$T^\\dagger$: swap and invert $s_k$' }], 'pinv');
        const PRE = { r2: [[1.3, 0.4], [0.3, 0.9]], r1: [[1.2, -0.6], [0.4, -0.2]] };
        v.select('', [{ value: 'r2', label: 'invertible' }, { value: 'r1', label: 'rank 1' }], 'r1', { onChange: (k) => H.set(PRE[k]) });
        const H = colHandles(W, PRE.r1, {
          c2: (x, y) => {
            const p = [Math.round(x * 10) / 10, Math.round(y * 10) / 10], a = [H.h1.x, H.h1.y];
            return len(a) > 0.1 && Math.abs(p[0] * a[1] - p[1] * a[0]) < 0.09 * len(a) ? scl(unit(a), dot([x, y], unit(a))) : p;
          },
        });
        const wh = W.handle(0.6, 1.6, { color: 'gold', label: 'w' });
        let st = null;
        v.render(() => {
          const T = H.A, { s, e, f } = svd22(T), w = [wh.x, wh.y], adj = which.value === 'adj';
          const tol = 1e-9 * Math.max(1, s[0]), m = s.filter((x) => x > tol).length;
          const c = f.map((fk) => dot(w, fk)), coef = [0, 1].map((k) => (k < m ? (adj ? s[k] * c[k] : c[k] / s[k]) : 0));
          const out = add(scl(e[0], coef[0]), scl(e[1], coef[1])), direct = adj ? mv(tr(T), w) : mv(M.pinv(T), w);
          const oc = adj ? 'orange' : 'green';
          // W
          if (m === 1) { W.line(-4 * f[0][0], -4 * f[0][1], 4 * f[0][0], 4 * f[0][1], { color: 'green', width: 6, alpha: 0.22 }); const lp = scl(f[0], f[0][1] >= 0 ? 2.1 : -2.1); W.tex('\\operatorname{range} T', lp[0], lp[1], { color: 'green', size: 13, dy: -12 }); }
          W.path(ellPts(T), { color: 'accent', width: 1, alpha: 0.5, dash: [3, 3] });
          f.forEach((u, k) => {
            const col = k ? 'purple' : 'blue', foot = scl(u, c[k]);
            W.line(-4 * u[0], -4 * u[1], 4 * u[0], 4 * u[1], { color: col, width: 1, alpha: 0.25 });
            W.arrow(0, 0, u[0], u[1], { color: col, width: 2.4 });
            W.tex(`f_${k + 1}`, u[0] * 1.25 - 0.12 * u[1], u[1] * 1.25 + 0.12 * u[0], { color: col, size: 14 });
            W.line(w[0], w[1], foot[0], foot[1], { color: col, width: 1, dash: [3, 3] });
            W.dot(foot[0], foot[1], { color: col, r: 3.5 });
          });
          if (!adj) { const Pw = add(scl(f[0], c[0]), m === 2 ? scl(f[1], c[1]) : [0, 0]); if (m === 1) { W.arrow(0, 0, Pw[0], Pw[1], { color: 'green', width: 3 }); W.tex('TT^\\dagger w', Pw[0], Pw[1], { color: 'green', size: 14, dx: 18, dy: 12 }); } }
          W.arrow(0, 0, w[0], w[1], { color: 'gold', width: 2.6 });
          // V
          V.circle(0, 0, 1, { color: 'muted', width: 1, dash: [4, 4] });
          const ax = [0, 1].map((k) => (k < m ? (adj ? s[k] : 1 / s[k]) : 0));
          V.path(Array.from({ length: 121 }, (_, i) => { const t = (TAU * i) / 120; return add(scl(e[0], ax[0] * Math.cos(t)), scl(e[1], ax[1] * Math.sin(t))); }), { color: oc, width: 1, alpha: 0.5, dash: [3, 3] });
          e.forEach((u, k) => {
            const col = k ? 'purple' : 'blue';
            V.line(-4 * u[0], -4 * u[1], 4 * u[0], 4 * u[1], { color: k < m || adj ? col : 'red', width: k < m || adj ? 1 : 3, alpha: k < m || adj ? 0.25 : 0.4 });
            V.arrow(0, 0, u[0], u[1], { color: col, width: 2.4 });
            V.tex(`e_${k + 1}`, u[0] * 1.25 - 0.12 * u[1], u[1] * 1.25 + 0.12 * u[0], { color: col, size: 14 });
          });
          if (!adj && m === 1) {
            const lp = scl(e[1], e[1][1] >= 0 ? 2.15 : -2.15); V.tex('\\operatorname{null} T', lp[0], lp[1], { color: 'red', size: 13, dx: 26 });
            const a = add(out, scl(e[1], -4)), b = add(out, scl(e[1], 4));
            V.line(a[0], a[1], b[0], b[1], { color: 'orange', width: 1.6, dash: [6, 4] });
            rightMark(V, e[1], scl(out, -1), 0.14, 'orange', out);
          }
          const c1 = scl(e[0], coef[0]);
          V.arrow(0, 0, c1[0], c1[1], { color: 'blue', width: 1.8, dash: [5, 4] });
          if (m === 2) V.arrow(c1[0], c1[1], out[0], out[1], { color: 'purple', width: 1.8, dash: [5, 4] });
          V.dot(direct[0], direct[1], { color: oc, r: 10, hollow: true, width: 2 });
          V.arrow(0, 0, out[0], out[1], { color: oc, width: 3 });
          const bx = V.bounds, inside = out[0] > bx.x[0] && out[0] < bx.x[1] && out[1] > bx.y[0] && out[1] < bx.y[1];
          if (inside) V.tex(adj ? 'T^*w' : 'T^\\dagger w', out[0], out[1], { color: oc, size: 15, dx: 16, dy: -12 });
          else V.corner(`T†w has length ${pf(len(out), 1)}: off the panel (s₂ = ${pf(s[1], 3)} is tiny)`, 'tl', { color: 'red', weight: 700 });
          st = { T, s, m, adj, out, direct, c };
        });
        v.legend([['gold', '$w$'], ['blue', '$e_1, f_1$'], ['purple', '$e_2, f_2$'], ['orange', '$T^*w$'], ['green', '$T^\\dagger w$, $TT^\\dagger w$']]);
        v.readout(() => {
          if (!st) return '';
          const { s, m, adj, out, direct, c } = st;
          const terms = [0, 1].slice(0, m).map((k) => (adj ? `${tn(s[k])}\\cdot(${tn(c[k])})\\,e_${k + 1}` : `\\tfrac{${tn(c[k])}}{${tn(s[k])}}\\,e_${k + 1}`)).join(' + ');
          return `$s = ${tn(s[0])}, ${tn(s[1])}$ (rank ${m}); $\\langle w, f_k\\rangle = ${c.map((x) => tn(x)).join(', ')}$. ${adj ? '$T^*w' : '$T^\\dagger w'} = ${terms} = ${vtex(out)}$; computed directly ${adj ? '(transpose matrix)' : '(pseudoinverse matrix)'}: $${vtex(direct)}$ — difference $${v.sci(len(sub(out, direct)), 1)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.80
    {
      num: '7.80',
      kind: 'Theorem',
      name: 'Matrix version of SVD',
      statement: String.raw`Suppose $A$ is a $p$-by-$n$ matrix of rank $m \ge 1$. Then there exist a $p$-by-$m$ matrix $B$ with orthonormal columns, an $m$-by-$m$ diagonal matrix $D$ with positive numbers on the diagonal, and an $n$-by-$m$ matrix $C$ with orthonormal columns such that
$$A = BDC^*.$$`,
      idea: String.raw`Let $T: \mathbf F^n \to \mathbf F^p$ have matrix $A$; then $\dim \operatorname{range} T = m$ (3.78), so 7.70 gives $Tv = \sum_{k=1}^m s_k\langle v, e_k\rangle f_k$. Take $B = [f_1 \cdots f_m]$, $D = \operatorname{diag}(s_1, \dots, s_m)$, $C = [e_1 \cdots e_m]$. Then $AC = BD$ column by column ($Ae_k = s_kf_k$), so $ACC^* = BDC^*$; and $ACC^* = A$ because $CC^*$ fixes each $e_k$ while both sides kill $(\operatorname{span}(e_1,\dots,e_m))^\perp$. Read as $A = \sum_k s_k f_k e_k^*$, the factorization writes $A$ as a sum of rank-one layers; the layers are orthonormal for the entrywise (Frobenius) inner product, so dropping all but the first $k$ leaves an error of exactly $\sqrt{s_{k+1}^2 + \cdots + s_m^2}$. Storing $B, D, C$ takes $m(p + m + n)$ numbers instead of $pn$.`,
      caption: String.raw`A $60 \times 80$ grey-scale picture is a matrix $A$ of numbers between $0$ (black) and $1$ (white). Its factors are computed, and $A_k = B_kD_kC_k^*$ keeps only the first $k$ columns of $B$ and $C$ and the $k$ largest singular values. Drag $k$ (or click the spectrum): the picture sharpens, the error image $A - A_k$ (red where $A$ is lighter, blue where darker) fades, and the measured error matches $\sqrt{\sum_{j>k} s_j^2}$. The tartan has rank $3$, so $k = 3$ already gives $A = BDC^*$ exactly. Switch to *the factors* to see $B_k$, $D_k$ and $C_k^*$ themselves.`,
      deps: ['ladr-7.70', 'ladr-3.78'],
      tags: ['singular values', 'factorization'],
      credit: 'Eckart & Young, 1936',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Singular_value_decomposition' },
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-3, 259], y: [-3, 69], equal: true, axes: false, height: 285, full: true });
        const G = v.stage({ x: [-1.6, 60.8], y: [0.01, 100], ylog: true, height: 170, full: true, axes: 'box', xlabel: 'j', title: 'singular values $s_j$ of the picture, log scale (click to choose $k$)' });
        const pic = v.select('', [{ value: 'land', label: 'landscape' }, { value: 'face', label: 'portrait' }, { value: 'plaid', label: 'tartan' }], 'land');
        const view = v.select('show', [{ value: 'img', label: 'images' }, { value: 'fac', label: 'the factors' }], 'img');
        const kS = v.slider('terms $k$', 1, 60, 6, { int: true, step: 1 });
        G.onClick((x) => kS.set(Math.max(1, Math.min(60, Math.round(x)))));
        const cache = {};
        const get = (name) => {
          if (cache[name]) return cache[name];
          const f = PICS[name], A = [];
          for (let i = 0; i < IMG_P; i++) { const r = []; for (let j = 0; j < IMG_N; j++) r.push(Math.min(1, Math.max(0, f(j + 0.5, i + 0.5)))); A.push(r); }
          const { U, S: s, V } = M.svd(A), m = s.filter((x) => x > 1e-10 * s[0]).length;
          return (cache[name] = { A, U, s, V, m, ak: {}, mU: maxAbs(U.map((r) => r.slice(0, 60))), mV: maxAbs(V) });
        };
        const approx = (D, k) => D.ak[k] || (D.ak[k] = D.A.map((r, i) => r.map((_, j) => { let x = 0; for (let l = 0; l < k; l++) x += D.s[l] * D.U[i][l] * D.V[j][l]; return x; })));
        const gray = (x) => { const g = Math.round(255 * Math.min(1, Math.max(0, x))); return [g, g, g, 255]; };
        const signed = (x, sc) => (x >= 0 ? rgba(v, 'red', Math.min(1, x / sc)) : rgba(v, 'blue', Math.min(1, -x / sc)));
        let st = null;
        v.render(() => {
          const D = get(pic.value), k = Math.round(kS.value), Ak = approx(D, k), fac = view.value === 'fac';
          const { A, U, s, V } = D;
          S.setView(fac ? [-3, 275] : [-3, 259], [-3, 69]);
          const kk = Math.min(k, D.m);
          let mU = 1e-12, mV = 1e-12; for (let l = 0; l < kk; l++) { for (let i = 0; i < IMG_P; i++) mU = Math.max(mU, Math.abs(U[i][l])); for (let j = 0; j < IMG_N; j++) mV = Math.max(mV, Math.abs(V[j][l])); }
          const rects = fac ? [
            { x0: 0, y0: 0, w: 40, h: 60, rows: IMG_P, cols: kk, cell: (i, j) => signed(U[i][j], mU * 0.75) },
            { x0: 48, y0: 10, w: 40, h: 40, rows: kk, cols: kk, cell: (i, j) => (i === j ? rgba(v, 'gold', 0.2 + (0.8 * s[i]) / s[0]) : null) },
            { x0: 96, y0: 10, w: 80, h: 40, rows: kk, cols: IMG_N, cell: (i, j) => signed(V[j][i], mV * 0.75) },
            { x0: 192, y0: 0, w: 80, h: 60, rows: IMG_P, cols: IMG_N, cell: (i, j) => gray(Ak[i][j]) },
          ] : [
            { x0: 0, y0: 0, w: 80, h: 60, rows: IMG_P, cols: IMG_N, cell: (i, j) => gray(A[i][j]) },
            { x0: 88, y0: 0, w: 80, h: 60, rows: IMG_P, cols: IMG_N, cell: (i, j) => gray(Ak[i][j]) },
            { x0: 176, y0: 0, w: 80, h: 60, rows: IMG_P, cols: IMG_N, cell: (i, j) => signed(A[i][j] - Ak[i][j], 0.25) },
          ];
          S.raster((x, y) => {
            for (const R of rects) if (x >= R.x0 && x < R.x0 + R.w && y >= R.y0 && y < R.y0 + R.h) {
              const j = Math.min(R.cols - 1, Math.floor(((x - R.x0) / R.w) * R.cols)), i = Math.min(R.rows - 1, Math.floor(((R.y0 + R.h - y) / R.h) * R.rows));
              return R.cell(i, j);
            }
            return null;
          }, { key: [pic.value, k, view.value, v.rgb('red').join(), v.rgb('panel').join()].join('|'), res: 1 });
          for (const R of rects) S.rect(R.x0, R.y0, R.x0 + R.w, R.y0 + R.h, { color: 'muted', width: 1 });
          const ex = k >= D.m, sub = ex ? '' : '_k';
          const TT = fac ? [`B${sub}\\ (60\\times ${kk})`, `D${sub}\\ (${kk}\\times ${kk})`, `C${sub}^*\\ (${kk}\\times 80)`, ex ? 'A = BDC^*' : 'A_k = B_kD_kC_k^*'] : ['A\\ \\ (60\\times 80)', `A_k,\\ \\text{rank } ${kk}`, 'A - A_k'];
          rects.forEach((R, i) => S.tex(TT[i], R.x0 + R.w / 2, R.y0 + R.h + 5.5, { size: 14, color: i === 1 && !fac ? 'accent' : 'ink' }));
          if (fac) { S.text('=', 184, 30, { size: 26, align: 'center', color: 'muted' }); S.text('·', 44, 30, { size: 26, align: 'center', color: 'muted' }); S.text('·', 92, 30, { size: 26, align: 'center', color: 'muted' }); }
          // errors
          let e2 = 0; for (let i = 0; i < IMG_P; i++) for (let j = 0; j < IMG_N; j++) e2 += (A[i][j] - Ak[i][j]) ** 2;
          if (!fac && e2 < 1e-16) S.text('A − Aₖ = 0: exact', 216, 30, { align: 'center', size: 14, color: 'green', weight: 700 });
          const tail = Math.sqrt(s.slice(k).reduce((a, x) => a + x * x, 0)), tot = Math.sqrt(s.reduce((a, x) => a + x * x, 0));
          // spectrum
          const lo = 0.012;
          s.forEach((x, j) => {
            const kept = j < k, real = x > 1e-10 * s[0], y = Math.max(lo * 1.15, x);
            G.line(j + 1, lo, j + 1, y, { color: kept ? 'blue' : 'red', width: 2.4, alpha: real ? 0.85 : 0.25 });
            if (real) G.dot(j + 1, x, { color: kept ? 'blue' : 'red', r: 2.6, ring: false });
          });
          G.vline(k + 0.5, { color: 'gold', width: 1.6, dash: [4, 4] });
          G.text(`kept: ${k}`, k + 0.5, 55, { align: 'right', dx: -6, size: 12, color: 'blue', weight: 600 });
          if (k < 60) G.text(`discarded: √(Σ sⱼ² over j > ${k}) = ${pf(tail, 3)}`, k + 0.5, 55, { align: 'left', dx: 6, size: 12, color: 'red', weight: 600 });
          if (D.m < 60) G.text(`sⱼ = 0 for j > ${D.m} = rank A`, 59.5, 18, { align: 'right', size: 12, color: 'muted', weight: 600 });
          st = { k, m: D.m, err: Math.sqrt(e2), tail, tot, kk };
        });
        v.legend([['blue', 'kept singular values', { dot: true }], ['red', 'discarded', { dot: true }], ['red', '$A - A_k > 0$', { area: true }], ['blue', '$A - A_k < 0$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { k, m, err, tail, tot, kk } = st;
          const sizes = k >= m ? `Since $k \\ge m$, $A_k = A = BDC^*$ exactly, with $B$ $60\\times${m}$, $D$ $${m}\\times${m}$, $C$ $80\\times${m}$: $m(p + m + n) = ${m * (140 + m)}$ numbers instead of $pn = 4800$.` : `With $k = ${k}$: $B_k$ is $60\\times${kk}$, $D_k$ is $${kk}\\times${kk}$, $C_k$ is $80\\times${kk}$ — $k(p + k + n) = ${k * (140 + k)}$ numbers instead of $pn = 4800$.`;
          return `rank $m = ${m}$. ${sizes} Measured $\\|A - A_k\\|_F = ${tn(err, 4)}$; predicted $\\sqrt{\\sum_{j>k} s_j^2} = ${tn(tail, 4)}$ (${tn((100 * err) / tot, 1)}% of $\\|A\\|_F$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.82
    {
      num: '7.82',
      kind: 'Theorem',
      name: 'Upper bound for ‖Tv‖',
      statement: String.raw`Suppose $T \in \mathcal L(V, W)$ and $s_1$ is the largest singular value of $T$. Then
$$\|Tv\| \le s_1\|v\|$$
for all $v \in V$. Equality holds for $v = e_1$ in a singular value decomposition of $T$, so $\max\{\|Tv\| : \|v\| \le 1\} = s_1$.`,
      idea: String.raw`Write $Tv = s_1\langle v, e_1\rangle f_1 + \cdots + s_m\langle v, e_m\rangle f_m$ (7.70). Since the $f_k$ are orthonormal, $\|Tv\|^2 = s_1^2|\langle v, e_1\rangle|^2 + \cdots + s_m^2|\langle v, e_m\rangle|^2$ (6.24). Replace every $s_k$ by the largest one and use Bessel's inequality (6.26): $\|Tv\|^2 \le s_1^2\big(|\langle v, e_1\rangle|^2 + \cdots + |\langle v, e_m\rangle|^2\big) \le s_1^2\|v\|^2$. For $v = e_1$ we get $Te_1 = s_1f_1$, of norm $s_1$. Geometrically, $s_1$ is the longest semi-axis of the image of the unit sphere.`,
      caption: String.raw`Drag $T(1,0)$, $T(0,1)$ to edit $T$, and the gold $v$ anywhere. Left: the image ellipse of the unit circle sits inside the green circle of radius $s_1$, touching it only at $\pm s_1f_1 = \pm Te_1$; and $Tv$ always stays inside the dotted circle of radius $s_1\|v\|$. Right: for each unit direction $u$, $\|Tu\|^2$ (computed directly, blue line) splits into $s_1^2|\langle u, e_1\rangle|^2$ and $s_2^2|\langle u, e_2\rangle|^2$; replacing $s_2$ by $s_1$ would fill the strip up to the green line $s_1^2$ — the inequality in the proof.`,
      deps: ['ladr-7.70', 'ladr-6.26', 'ladr-6.24'],
      tags: ['singular values', 'norms'],
      viz(v) {
        const S = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, height: 370, minWidth: 290 });
        const G = v.stage({ x: [0, TAU], y: [0, 4], height: 370, minWidth: 280, axes: 'box', xlabel: 'angle of u', xticks: [[Math.PI / 2, 'π/2'], [Math.PI, 'π'], [(3 * Math.PI) / 2, '3π/2'], [TAU, '2π']], title: '$\\|Tu\\|^2$ for unit $u$, split along $e_1, e_2$' });
        const H = colHandles(S, [[0.4, 1.2], [1.1, 0.3]]);
        const vh = S.handle(-1.0, 0.75, { color: 'gold', label: 'v' });
        let st = null;
        v.render(() => {
          const T = H.A, { s, e, f } = svd22(T), vv = [vh.x, vh.y], Tv = mv(T, vv), nv = len(vv);
          S.circle(0, 0, s[0], { color: 'green', width: 1.8, dash: [7, 4], fill: 'green', fillAlpha: 0.04 });
          S.circle(0, 0, 1, { color: 'muted', dash: [4, 4], width: 1 });
          S.path(ellPts(T), { fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 1.8 });
          S.circle(0, 0, s[0] * nv, { color: 'green', width: 1.2, dash: [2, 3], alpha: 0.8 });
          for (const sg of [1, -1]) { S.dot(sg * e[0][0], sg * e[0][1], { color: 'blue', r: 4 }); S.dot(sg * s[0] * f[0][0], sg * s[0] * f[0][1], { color: 'green', r: 5.5 }); }
          const t1 = scl(f[0], s[0]);
          S.arrow(0, 0, t1[0], t1[1], { color: 'green', width: 2.2 });
          const nn = perp(f[0]), up = nn[1] < 0 ? scl(nn, -1) : nn, lp = add(scl(t1, 0.55), scl(up, 0.28));
          S.tex('s_1 f_1 = Te_1', lp[0], lp[1], { color: 'green', size: 14 });
          S.tex('e_1', e[0][0] * 1.22, e[0][1] * 1.22, { color: 'blue', size: 14 });
          S.arrow(0, 0, vv[0], vv[1], { color: 'gold', width: 2.4 });
          S.arrow(0, 0, Tv[0], Tv[1], { color: 'purple', width: 2.6 });
          S.tex('Tv', Tv[0], Tv[1], { color: 'purple', size: 15, dx: 13, dy: -10 });
          // the split of ‖Tu‖²
          const a = (t) => s[0] ** 2 * dot(uAt(t), e[0]) ** 2, b = (t) => s[1] ** 2 * dot(uAt(t), e[1]) ** 2, top = s[0] ** 2;
          G.setView(null, [0, Math.max(0.5, top * 1.18)]);
          G.between((t) => top, (t) => a(t) + b(t), 0, TAU, { fill: 'green', fillAlpha: 0.08 });
          G.between(a, () => 0, 0, TAU, { fill: 'blue', fillAlpha: 0.28 });
          G.between((t) => a(t) + b(t), a, 0, TAU, { fill: 'purple', fillAlpha: 0.28 });
          G.fn((t) => len(mv(T, uAt(t))) ** 2, { color: 'accent', width: 2.4, n: 240 });
          G.hline(top, { color: 'green', width: 1.8, dash: [7, 4] });
          G.text(`s₁² = ${pf(top)}`, 0.1, top, { color: 'green', dy: -10, size: 12, weight: 600 });
          const th = ((Math.atan2(vv[1], vv[0]) % TAU) + TAU) % TAU, nu = nv > 1e-9 ? len(mv(T, scl(vv, 1 / nv))) ** 2 : 0;
          G.vline(th, { color: 'gold', width: 1.3, dash: [4, 4] }); G.dot(th, nu, { color: 'gold', r: 4.5 });
          const te = ((Math.atan2(e[0][1], e[0][0]) % Math.PI) + Math.PI) % Math.PI;
          for (const x of [te, te + Math.PI]) G.dot(x, top, { color: 'green', r: 4.5 });
          let mx = 0; for (let k = 0; k < 720; k++) mx = Math.max(mx, len(mv(T, uAt((Math.PI * k) / 720))));
          st = { s, nTv: len(Tv), nv, mx, e };
        });
        v.legend([['accent', '$\\|Tu\\|^2$ (direct)'], ['blue', '$s_1^2|\\langle u, e_1\\rangle|^2$', { area: true }], ['purple', '$s_2^2|\\langle u, e_2\\rangle|^2$', { area: true }], ['green', '$s_1^2$ and radius $s_1$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { s, nTv, nv, mx, e } = st;
          return `$\\|Tv\\| = ${tn(nTv, 3)} \\le s_1\\|v\\| = ${tn(s[0], 3)} \\cdot ${tn(nv, 3)} = ${tn(s[0] * nv, 3)}$ (ratio $${tn(nv > 1e-9 ? nTv / (s[0] * nv) : 0, 3)}$). Over the unit circle $\\max\\|Tu\\| = ${tn(mx, 4)} = s_1$, the longest semi-axis, reached at $u = \\pm e_1 = \\pm${vtex(e[0])}$.`;
        });
      },
    },
  ],
};
