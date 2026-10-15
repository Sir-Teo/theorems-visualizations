// Sheldon Axler, Linear Algebra Done Right (4th ed.) — Chapter 5: Eigenvalues and Eigenvectors
// Part 1 (this file): items 5.1–5.29 — operators, invariant subspaces, eigenvalues, p(T), the minimal polynomial.

// ---------- shared helpers ----------
const TAU = 2 * Math.PI;
const DEG = 180 / Math.PI;

/** Number for TeX: d decimals, trailing zeros trimmed, never "-0". */
function nm(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  const t = Number(x.toFixed(d));
  return t === 0 ? '0' : String(t);
}
/** Same, with a typographic minus (canvas text). */
const nmc = (x, d = 2) => nm(x, d).replace('-', '−');
/** a + bi as TeX. */
function cxT(re, im, d = 2) {
  const a = Number(re.toFixed(d)), b = Number(im.toFixed(d));
  if (b === 0) return nm(a, d);
  const bb = Math.abs(b) === 1 ? '' : nm(Math.abs(b), d);
  if (a === 0) return `${b < 0 ? '-' : ''}${bb}i`;
  return `${nm(a, d)} ${b < 0 ? '-' : '+'} ${bb}i`;
}
/** Real polynomial with ascending coefficients c, as TeX in the variable v. */
function polyT(c, v = 'z', d = 2) {
  let s = '';
  for (let k = c.length - 1; k >= 0; k--) {
    const a = Number(c[k].toFixed(d)); if (a === 0) continue;
    const mag = Math.abs(a) === 1 && k > 0 ? '' : nm(Math.abs(a), d);
    const mon = k === 0 ? '' : k === 1 ? v : `${v}^{${k}}`;
    s += s ? ` ${a < 0 ? '-' : '+'} ${mag}${mon}` : `${a < 0 ? '-' : ''}${mag}${mon}`;
  }
  return s || '0';
}
const matT = (A, d = 2) => `\\begin{pmatrix}${A.map((r) => r.map((x) => nm(x, d)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;
const vecT = (u, d = 2) => `\\begin{pmatrix}${u.map((x) => nm(x, d)).join(' \\\\ ')}\\end{pmatrix}`;

// vectors and matrices (arrays; matrices are lists of rows)
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const add = (a, b) => a.map((x, i) => x + b[i]);
const sub = (a, b) => a.map((x, i) => x - b[i]);
const scl = (a, k) => a.map((x) => x * k);
const len = (a) => Math.hypot(...a);
const unit = (a) => scl(a, 1 / (len(a) || 1));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const det2 = (a, b) => a[0] * b[1] - a[1] * b[0];
const mv = (A, x) => A.map((r) => dot(r, x));
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
const eye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
const fro = (A) => Math.sqrt(A.flat().reduce((s, x) => s + x * x, 0));
const msub = (A, B) => A.map((r, i) => r.map((x, j) => x - B[i][j]));
const clone = (A) => A.map((r) => r.slice());
const col = (A, j) => A.map((r) => r[j]);
/** Orthonormal pair spanning span(a, b) (second entry null when they are parallel). */
function onb(a, b) { const e = unit(a), w = sub(b, scl(e, dot(b, e))); return [e, len(w) < 1e-9 ? null : unit(w)]; }
/** Orthonormal pair spanning the plane perpendicular to n. */
function perpPair(n) { const u = unit(n), a = unit(Math.abs(u[0]) < 0.9 ? cross(u, [1, 0, 0]) : cross(u, [0, 1, 0])); return [a, cross(u, a)]; }

/** Σ c_k A^k (ascending coefficients) by Horner's scheme. */
function polyMat(c, A) {
  const n = A.length; let R = A.map((r) => r.map(() => 0));
  for (let k = c.length - 1; k >= 0; k--) { R = mm(R, A); for (let i = 0; i < n; i++) R[i][i] += c[k]; }
  return R;
}
/** Product of polynomials (ascending coefficients). */
function pmul(a, b) { const r = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return r; }
/** Long division a = s·b + r with deg r < deg b (ascending coefficients). */
function pdiv(a, b) {
  const r = a.slice(), db = b.length - 1, s = new Array(Math.max(1, a.length - db)).fill(0);
  for (let k = a.length - 1; k >= db; k--) { const f = r[k] / b[db]; s[k - db] = f; for (let j = 0; j <= db; j++) r[k - db + j] -= f * b[j]; }
  const rr = r.slice(0, Math.max(1, db)).map((x) => (Math.abs(x) < 1e-9 ? 0 : x));
  return { s, r: rr };
}
/** Value at the complex number z of a real polynomial (ascending coefficients). */
function cHorner(v, c, z) { let acc = v.cx(0, 0); for (let k = c.length - 1; k >= 0; k--) acc = acc.mul(z).add(v.cx(c[k], 0)); return acc; }
/**
 * Minimal polynomial by testing I, A, A², …: the first power that is a linear combination of the earlier
 * ones gives the monic polynomial of least degree that kills A. → {c (ascending, monic), res: relative
 * distances of A^1, A^2, … from the span of the earlier powers}.
 */
function minPoly(M, A, tol = 1e-8) {
  const n = A.length, cols = [], res = []; let P = eye(n);
  for (let k = 0; k <= n; k++) {
    const b = P.flat(), nb = len(b);
    if (k > 0) {
      const Am = b.map((_, r) => cols.map((cv) => cv[r])), x = M.lstsq(Am, b), r = len(sub(b, mv(Am, x))) / (1 + nb);
      res.push(r);
      if (r < tol) return { c: [...x.map((t) => -t), 1], res };
    }
    cols.push(b); P = mm(P, A);
  }
  return { c: M.charPoly(A), res };
}
/** Group nearly equal complex numbers ({re, im}) into {re, im, m}. */
function groupRoots(zs, tol = 2e-3) {
  const out = [];
  for (const z of zs) {
    const g = out.find((o) => Math.hypot(o.re - z.re, o.im - z.im) < tol * (1 + Math.hypot(z.re, z.im)));
    if (g) { g.re = (g.re * g.m + z.re) / (g.m + 1); g.im = (g.im * g.m + z.im) / (g.m + 1); g.m++; } else out.push({ re: z.re, im: z.im, m: 1 });
  }
  for (const g of out) { if (Math.abs(g.im) < 1e-6) g.im = 0; if (Math.abs(g.re) < 1e-7) g.re = 0; }
  return out.sort((a, b) => b.re - a.re || b.im - a.im);
}
/** Factored TeX of a real monic polynomial from its grouped zeros (conjugate pairs merged into quadratics). */
function factT(gs, v = 'z') {
  let s = '';
  for (const g of gs) {
    if (g.im < 0) continue;
    const pw = g.m > 1 ? `^{${g.m}}` : '';
    if (g.im === 0) s += Math.abs(g.re) < 5e-3 ? `${v}${pw}` : `(${v} ${g.re > 0 ? '-' : '+'} ${nm(Math.abs(g.re))})${pw}`;
    else s += `(${polyT([g.re * g.re + g.im * g.im, -2 * g.re, 1], v)})${pw}`;
  }
  return s || '1';
}
const rootsOf = (M, c) => groupRoots(M.polyRoots(c).map((z) => ({ re: z.re, im: z.im })));
/** Eigen-data of a real 2×2 matrix. */
function eig2x2(A) {
  const [[a, b], [c, d]] = A, tr = a + d, det = a * d - b * c, disc = (tr * tr) / 4 - det;
  if (disc >= -1e-12) { const s = Math.sqrt(Math.max(0, disc)); return { real: true, l: s < 1e-6 ? [tr / 2] : [tr / 2 + s, tr / 2 - s], tr, det }; }
  return { real: false, re: tr / 2, im: Math.sqrt(-disc), tr, det };
}
/** Unit eigenvector of the 2×2 matrix A for the real eigenvalue l (null when A = lI). */
function evec2(A, l) {
  const [[a, b], [c, d]] = A, x = [b, l - a], y = [l - d, c];
  const u = len(x) >= len(y) ? x : y, r = len(u);
  return r < 1e-9 ? null : [u[0] / r, u[1] / r];
}
/** Draggable columns Te₁, Te₂ of a 2×2 matrix (snapped to a 0.1 grid). */
function colHandles(S, A0) {
  const snap = (x, y) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
  const h1 = S.handle(A0[0][0], A0[1][0], { color: 'teal', label: 'Te₁', constrain: snap });
  const h2 = S.handle(A0[0][1], A0[1][1], { color: 'pink', label: 'Te₂', constrain: snap });
  return { get A() { return [[h1.x, h2.x], [h1.y, h2.y]]; }, set(A) { h1.set(A[0][0], A[1][0]); h2.set(A[0][1], A[1][1]); } };
}
/** The image of the unit square under A, with the column arrows. */
function drawCols(S, A, { fill = 'teal', alpha = 0.07 } = {}) {
  const a = col(A, 0), b = col(A, 1);
  S.poly([[0, 0], a, add(a, b), b], { fill, fillAlpha: alpha, color: fill, alpha: 0.35, width: 1 });
  S.arrow(0, 0, a[0], a[1], { color: 'teal', width: 2 });
  S.arrow(0, 0, b[0], b[1], { color: 'pink', width: 2 });
}
/** Unit circle (dashed) and its image ellipse under A. */
function drawEllipse(S, A, st = {}) {
  S.circle(0, 0, 1, { color: 'muted', dash: [4, 4], width: 1 });
  const pts = []; for (let k = 0; k <= 120; k++) { const t = (TAU * k) / 120; pts.push(mv(A, [Math.cos(t), Math.sin(t)])); }
  S.path(pts, { close: true, fill: 'accent', fillAlpha: 0.07, color: 'accent', width: 1.6, ...st });
}
/** Images under B of the grid lines x = i, y = i (|i| ≤ g) and of the unit square. */
function gridImage(S, B, { color = 'accent', g = 2, alpha = 0.35 } = {}) {
  for (let i = -g; i <= g; i++) {
    const p = mv(B, [i, -g]), q = mv(B, [i, g]), r = mv(B, [-g, i]), s = mv(B, [g, i]);
    S.line(p[0], p[1], q[0], q[1], { color, width: i ? 1 : 1.6, alpha });
    S.line(r[0], r[1], s[0], s[1], { color, width: i ? 1 : 1.6, alpha });
  }
}
/** Editable matrix on a [0,1]² stage: drag an entry up/down, or click its upper/lower half, to change it in steps. */
function matEditor(S, get, { step = 0.5, lim = 3, label = 'T' } = {}) {
  const box = () => { const n = get().length; return { n, x0: 0.17, y0: 0.05, cw: 0.78 / n, ch: 0.9 / n }; };
  const hit = (x, y) => { const b = box(), j = Math.floor((x - b.x0) / b.cw), i = Math.floor((b.y0 + b.n * b.ch - y) / b.ch); return i >= 0 && i < b.n && j >= 0 && j < b.n ? [i, j] : null; };
  const put = (i, j, val) => { get()[i][j] = Math.max(-lim, Math.min(lim, Math.round(val / step) * step)); };
  let drag = null, active = null;
  S.onDrag((x, y, ph) => {
    if (ph === 'start') { const c = hit(x, y); drag = c && { c, y0: y, a0: get()[c[0]][c[1]] }; active = c; }
    else if (ph === 'move' && drag) put(drag.c[0], drag.c[1], drag.a0 + Math.round((y - drag.y0) / (0.3 * box().ch)) * step);
    else if (ph === 'end') { drag = null; active = null; }
  });
  S.onClick((x, y) => { const c = hit(x, y); if (!c) return; const b = box(), yc = b.y0 + (b.n - c[0] - 0.5) * b.ch; put(c[0], c[1], get()[c[0]][c[1]] + (y > yc ? step : -step)); });
  return () => {
    const A = get(), b = box(), top = b.y0 + b.n * b.ch, x1 = b.x0 + b.n * b.cw;
    const px = Math.abs(S.X(b.cw) - S.X(0)), py = Math.abs(S.Y(0) - S.Y(b.ch)), size = Math.max(11, Math.min(20, px * 0.28, py * 0.4));
    for (let i = 0; i < b.n; i++) for (let j = 0; j < b.n; j++) {
      const x = b.x0 + j * b.cw, y = top - (i + 1) * b.ch, on = active && active[0] === i && active[1] === j;
      S.rect(x + 0.006, y + 0.01, x + b.cw - 0.006, y + b.ch - 0.01, { fill: on ? 'gold' : 'accent', fillAlpha: on ? 0.25 : 0.06, stroke: false });
      S.text(nmc(A[i][j], 2), x + b.cw / 2, y + b.ch / 2, { size, align: 'center', baseline: 'middle' });
      S.text('▴', x + b.cw / 2, y + b.ch * 0.85, { size: 9, color: 'faint', align: 'center', baseline: 'middle' });
      S.text('▾', x + b.cw / 2, y + b.ch * 0.15, { size: 9, color: 'faint', align: 'center', baseline: 'middle' });
    }
    S.path([[b.x0 + 0.025, top], [b.x0 - 0.005, top], [b.x0 - 0.005, b.y0], [b.x0 + 0.025, b.y0]], { color: 'ink', width: 2 });
    S.path([[x1 - 0.025, top], [x1 + 0.005, top], [x1 + 0.005, b.y0], [x1 - 0.025, b.y0]], { color: 'ink', width: 2 });
    S.tex(`${label} =`, b.x0 - 0.03, (top + b.y0) / 2, { align: 'right', baseline: 'middle', size: 18 });
  };
}
/** A square matrix drawn as a tile of shaded cells (blue > 0, red < 0) with its entries. */
function drawTile(S, B, x0, y0, w, { frame = 'muted', dim = false } = {}) {
  const n = B.length, cw = w / n, mx = Math.max(1e-9, ...B.flat().map(Math.abs));
  const size = Math.max(8, Math.min(14, Math.abs(S.X(cw) - S.X(0)) * 0.27));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const b = Math.abs(B[i][j]) < 1e-9 ? 0 : B[i][j], x = x0 + j * cw, y = y0 + w - (i + 1) * cw;
    if (b) S.rect(x, y, x + cw, y + cw, { fill: b > 0 ? 'blue' : 'red', fillAlpha: dim ? 0.04 : 0.07 + (0.3 * Math.abs(b)) / mx, stroke: false });
    S.text(nmc(b, 2), x + cw / 2, y + cw / 2, { size, align: 'center', baseline: 'middle', color: dim || !b ? 'faint' : 'ink' });
  }
  S.rect(x0, y0, x0 + w, y0 + w, { color: frame, width: frame === 'green' ? 2.6 : 1.1 });
}

export default {
  collection: 'ladr',
  chapter: 5,
  title: 'Eigenvalues and Eigenvectors',
  summary: String.raw`Operators — linear maps from a space to itself — can be iterated and plugged into polynomials, and this makes invariant subspaces and eigenvectors the central objects. Eigenvectors for distinct eigenvalues are linearly independent, every operator on a nonzero finite-dimensional complex vector space has an eigenvalue, and the minimal polynomial, whose zeros are exactly the eigenvalues, decides when an upper-triangular or a diagonal matrix exists. The chapter ends with Gershgorin disks, which locate eigenvalues from the matrix entries, and with commuting operators, which can be triangularized or diagonalized simultaneously.`,
  items: [
    // ------------------------------------------------------------------ 5.1
    {
      num: '5.1',
      kind: 'Definition',
      name: 'Operator',
      statement: String.raw`A linear map from a vector space $V$ to the same space $V$ is called an **operator** on $V$. The set of all operators on $V$ is written $\mathcal L(V)$; in other words, $\mathcal L(V) = \mathcal L(V, V)$.`,
      idea: String.raw`Because an operator lands back in the space it started from, its output is again a legal input: $T^2 = TT$, $T^3 = TTT$, … all make sense and are operators, and so is every polynomial $a_0I + a_1T + \dots + a_mT^m$. A map $V \to W$ with $W \ne V$ cannot be composed with itself. This one extra feature is what makes invariant subspaces, eigenvalues and the minimal polynomial possible.`,
      caption: String.raw`Drag the columns $Te_1$ (teal) and $Te_2$ (pink) to edit $T$, or pick a preset, and drag the gold vector $v$. The gold path is the orbit $v, Tv, T^2v, \dots$, which only an operator can produce: each output is fed back in. A spiral winds into $0$, a saddle flings the orbit out along one direction, a shear drifts, and a quarter turn comes back after four steps.`,
      deps: ['ladr-3.1'],
      tags: ['operators'],
      viz(v) {
        const PRE = { spiral: [[0.85, -0.4], [0.4, 0.85]], saddle: [[1.2, 0.3], [0.3, 0.6]], shear: [[1, 0.5], [0, 1]], quarter: [[0, -1], [1, 0]] };
        v.select('preset', [{ value: 'spiral', label: 'spiral' }, { value: 'saddle', label: 'saddle' }, { value: 'shear', label: 'shear' }, { value: 'quarter', label: 'quarter turn' }], 'spiral', { onChange: (k) => C.set(PRE[k]) });
        const K = v.slider('steps $k$', 1, 24, 10, { int: true });
        const S = v.stage({ x: [-3, 3], y: [-2.4, 2.4], equal: true, height: 380 });
        const C = colHandles(S, PRE.spiral);
        const vh = S.handle(1.8, 0.7, { color: 'gold', label: 'v' });
        let st = null;
        v.render(() => {
          const A = C.A;
          drawCols(S, A);
          const pts = [[vh.x, vh.y]];
          for (let k = 0; k < K.value; k++) pts.push(mv(A, pts[k]));
          S.path(pts, { color: 'gold', width: 1.6, alpha: 0.7 });
          pts.forEach((p, k) => { if (k) S.dot(p[0], p[1], { r: 3.6, color: 'gold' }); });
          ['Tv', 'T^2v', 'T^3v'].forEach((s, i) => {
            const p = pts[i + 1];
            if (p && Math.abs(p[0]) < 2.8 && Math.abs(p[1]) < 2.2 && len(sub(p, pts[i])) > 0.25) S.tex(s, p[0], p[1], { color: 'gold', dx: 10, dy: -10, size: 14, align: 'left' });
          });
          const end = pts[pts.length - 1];
          S.corner(`|Tᵏv| = ${nmc(len(end), 3)} after k = ${K.value} steps`, 'tl', { color: 'gold', weight: 700 });
          st = { A, end };
          v.legend([['gold', 'orbit $v, Tv, T^2v, \\dots$'], ['teal', '$Te_1$'], ['pink', '$Te_2$']]);
        });
        v.readout(() => st && `$T = ${matT(st.A)},\\qquad T^{${K.value}} = ${matT(v.M.matPow(st.A, K.value))},\\qquad T^{${K.value}}v = ${vecT(st.end)}$`);
      },
    },
    // ------------------------------------------------------------------ 5.2
    {
      num: '5.2',
      kind: 'Definition',
      name: 'Invariant subspace',
      statement: String.raw`Let $T \in \mathcal L(V)$. A subspace $U$ of $V$ is **invariant under $T$** if $Tu \in U$ for every $u \in U$; equivalently, the restriction $T|_U$ is an operator on $U$.`,
      idea: String.raw`$\{0\}$, $V$, $\operatorname{null} T$ and $\operatorname{range} T$ are always invariant. The interesting ones are in between: a one-dimensional invariant subspace is exactly a line spanned by an eigenvector, and finding invariant subspaces is how one breaks an operator into smaller, simpler pieces. To test a subspace it suffices to check that $T$ maps a basis of $U$ into $U$.`,
      caption: String.raw`Choose a line or a plane $U$ (blue) through $0$ in $\mathbf R^3$ and drag its handle — for a plane, drag its normal $n$. The image $T(U)$ is drawn green when it stays inside $U$ and red when it leaves. Handles snap onto the invariant ones when close. The first operator has three invariant lines and three invariant planes; the rotation-like one has only one of each.`,
      deps: ['ladr-5.1', 'ladr-1.33'],
      tags: ['invariant subspaces'],
      viz(v) {
        const M = v.M;
        const P = [[1, 0.35, 0], [0.15, 1, 0.3], [0, 0.25, 1]], Pi = M.inverse(P), conj = (B) => mm(mm(P, B), Pi);
        const PRE = { diag: conj([[1.5, 0, 0], [0, 0.7, 0], [0, 0, -0.6]]), rot: conj([[0.5, -0.9, 0], [0.9, 0.5, 0], [0, 0, 1.3]]) };
        const which = v.select('$T$', [{ value: 'diag', label: 'three real eigenvalues' }, { value: 'rot', label: 'rotation-like' }], 'diag');
        const mode = v.select('$U$', [{ value: 'line', label: 'line' }, { value: 'plane', label: 'plane' }], 'line');
        const S = v.stage({ x: [-2, 2], y: [-1.8, 1.8], equal: true, axes: false, height: 400 });
        const sc = v.scene3(S, { yaw: -0.7, pitch: 0.35, axis: 1.5, lim: 1.45 });
        const dirs = (A) => M.eig(A).vectors.filter(Boolean).map(unit);
        const snapTo = (list) => (p) => {
          const r = len(p); if (r < 1e-6) return p;
          for (const d of list()) { const c = dot(p, d) / r; if (Math.abs(c) > Math.cos(7 / DEG)) return scl(d, Math.sign(c) * r); }
          return p;
        };
        const u = sc.handle([1, 0.55, 0.6], { color: 'accent', label: 'u', snap: snapTo(() => dirs(PRE[which.value])) });
        const nh = sc.handle([0.3, -0.5, 1.1], { color: 'orange', label: 'n', snap: snapTo(() => dirs(M.transpose(PRE[which.value]))) });
        let st = null;
        v.render(() => {
          const T = PRE[which.value], line = mode.value === 'line';
          u.h.visible = line; nh.h.visible = !line;
          sc.begin();
          if (line) {
            const d = unit(u.p), Tu = mv(T, u.p), dev = len(cross(d, Tu)) / Math.max(len(Tu), 1e-9), ok = dev < 1e-6;
            const c = ok ? 'green' : 'red';
            sc.line(scl(d, -1.9), scl(d, 1.9), { color: 'accent', width: 3 });
            const e = unit(Tu); sc.line(scl(e, -1.9), scl(e, 1.9), { color: c, width: 2, dash: [6, 4] });
            sc.arrow([0, 0, 0], u.p, { color: 'accent' }); sc.arrow([0, 0, 0], Tu, { color: c });
            sc.tex('Tu', Tu, { color: c, dx: 14, dy: -6 });
            st = { line, ok, ang: Math.asin(Math.min(1, dev)) * DEG, lam: dot(Tu, d) / len(u.p) };
          } else {
            const nn = unit(nh.p), [a, b] = perpPair(nn), Ta = mv(T, a), Tb = mv(T, b);
            const n2 = unit(cross(Ta, Tb)), dev = len(cross(nn, n2)), ok = dev < 1e-6, c = ok ? 'green' : 'red';
            const [ia, ib] = onb(Ta, Tb);
            sc.disc(a, b, 1.45, { fill: 'accent', fillAlpha: 0.13, color: 'accent', grid: true });
            sc.disc(ia, ib, 1.45, { fill: c, fillAlpha: 0.09, color: c, alpha: 0.5 });
            const circ = [], img = [];
            for (let k = 0; k < 72; k++) { const t = (TAU * k) / 72, p = add(scl(a, Math.cos(t)), scl(b, Math.sin(t))); circ.push(p); img.push(mv(T, p)); }
            sc.path(circ, { color: 'accent', width: 2, close: true });
            sc.path(img, { color: c, width: 2.4, close: true });
            sc.arrow([0, 0, 0], scl(nn, 1.1), { color: 'orange' });
            sc.tex('T(U)', mv(T, scl(b, 1.05)), { color: c, dx: 14 });
            st = { line, ok, ang: Math.asin(Math.min(1, dev)) * DEG };
          }
          sc.flush();
          S.corner(st.ok ? 'T(U) ⊆ U: invariant' : 'T(U) ⊄ U: not invariant', 'tl', { color: st.ok ? 'green' : 'red', weight: 700 });
          v.legend([['accent', '$U$'], [st.ok ? 'green' : 'red', '$T(U)$']]);
        });
        v.readout(() => {
          if (!st) return '';
          if (st.line) return st.ok ? `$Tu = ${nm(st.lam)}\\,u \\in U$: the line $U = \\operatorname{span}(u)$ is invariant, so $u$ is an eigenvector with eigenvalue $${nm(st.lam)}$.` : `$Tu \\notin U$: $Tu$ makes an angle of $${nm(st.ang, 1)}^\\circ$ with the line $U$, so $U$ is not invariant.`;
          return st.ok ? `$T$ maps the plane $U = n^\\perp$ onto itself: $U$ is invariant (its normal $n$ is an eigenvector of $T^{\\mathsf t}$).` : `$T(U)$ is a different plane, tilted $${nm(st.ang, 1)}^\\circ$ away from $U$: not invariant.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.5
    {
      num: '5.5',
      kind: 'Definition',
      name: 'Eigenvalue',
      statement: String.raw`Let $T \in \mathcal L(V)$. A number $\lambda \in \mathbf F$ is an **eigenvalue** of $T$ if there is a vector $v \in V$ with $v \ne 0$ and
$$Tv = \lambda v.$$`,
      idea: String.raw`$Tv = \lambda v$ for some $v \ne 0$ says exactly that the line $\operatorname{span}(v)$ is a one-dimensional invariant subspace, on which $T$ acts as multiplication by $\lambda$. Geometrically: $Tv$ points along $v$ (forward if $\lambda > 0$, backward if $\lambda < 0$) and $\lambda$ is the signed stretch factor. The condition $v \ne 0$ matters, since $T0 = \lambda 0$ for every $\lambda$.`,
      caption: String.raw`Drag the unit vector $v$ (gold) around the circle. The red segment is the part of $Tv$ that sticks out of the line through $v$; on the right, the red curve plots it for every direction and the blue curve plots the part along $v$. At a zero of the red curve $Tv = \lambda v$ (green), and the blue curve reads off $\lambda$. The rotation has no real eigenvalue: its red curve never vanishes.`,
      deps: ['ladr-5.1'],
      tags: ['eigenvalues'],
      viz(v) {
        const PRE = { sym: [[1.5, 0.5], [0.5, 0.5]], flip: [[0.4, 1.2], [0.8, -0.6]], shear: [[1, 0.8], [0, 1]], rot: [[0.6, -0.8], [0.8, 0.6]] };
        const which = v.select('$T$', [{ value: 'sym', label: 'symmetric' }, { value: 'flip', label: 'with $\\lambda < 0$' }, { value: 'shear', label: 'shear' }, { value: 'rot', label: 'rotation' }], 'sym');
        const S = v.stage({ x: [-2.1, 2.1], y: [-1.9, 1.9], equal: true, height: 360, weight: 1.1 });
        const G = v.stage({ x: [0, 180], y: [-1.5, 2], height: 360, xlabel: 'direction θ of v (degrees)', xticks: [0, 45, 90, 135, 180], title: 'along $v$: $\\langle Tv, v\\rangle$ · off $v$: $\\det[v,\\ Tv]$' });
        const eigAngles = () => { const A = PRE[which.value], e = eig2x2(A); return e.real ? e.l.map((l) => { const u = evec2(A, l); return u ? (Math.atan2(u[1], u[0]) + TAU) % Math.PI : null; }).filter((x) => x !== null) : []; };
        const vh = S.handle(Math.cos(1.2), Math.sin(1.2), {
          color: 'gold', label: 'v', constrain: (x, y) => {
            let th = Math.atan2(y, x);
            for (const e of eigAngles()) for (const f of [e, e - Math.PI, e + Math.PI]) if (Math.abs(th - f) < 3 / DEG) th = f;
            return [Math.cos(th), Math.sin(th)];
          },
        });
        let st = null;
        v.render(() => {
          const A = PRE[which.value], vv = [vh.x, vh.y], Tv = mv(A, vv), along = dot(Tv, vv), off = det2(vv, Tv), ok = Math.abs(off) < 1e-9;
          drawEllipse(S, A);
          const angs = eigAngles();
          for (const e of angs) { const d = [Math.cos(e), Math.sin(e)]; S.line(-2.6 * d[0], -2.6 * d[1], 2.6 * d[0], 2.6 * d[1], { color: 'green', width: 1, alpha: 0.45, dash: [3, 4] }); }
          S.line(-2.6 * vv[0], -2.6 * vv[1], 2.6 * vv[0], 2.6 * vv[1], { color: 'gold', width: 1, alpha: 0.6 });
          const foot = scl(vv, along);
          if (!ok) { S.line(foot[0], foot[1], Tv[0], Tv[1], { color: 'red', width: 3 }); S.dot(foot[0], foot[1], { r: 3, color: 'red' }); }
          S.arrow(0, 0, Tv[0], Tv[1], { color: ok ? 'green' : 'accent', width: 2.6 });
          S.tex('Tv', Tv[0], Tv[1], { color: ok ? 'green' : 'accent', dx: 14, dy: -10 });
          S.arrow(0, 0, vv[0], vv[1], { color: 'gold', width: 2.6 });
          S.corner(ok ? `Tv = λv with λ = ${nmc(along, 3)}` : 'Tv is not a multiple of v', 'tl', { color: ok ? 'green' : 'muted', weight: 700 });
          // graph over all directions
          const fa = (t) => { const w = [Math.cos(t / DEG), Math.sin(t / DEG)]; return dot(mv(A, w), w); };
          const fo = (t) => { const w = [Math.cos(t / DEG), Math.sin(t / DEG)]; return det2(w, mv(A, w)); };
          G.fn(fa, { color: 'blue', width: 2.2 });
          G.fn(fo, { color: 'red', width: 2.2 });
          for (const e of angs) { const t = e * DEG; G.vline(t, { color: 'green', width: 1, dash: [3, 4] }); G.dot(t, fa(t), { r: 5, color: 'green', label: `λ = ${nmc(fa(t))}`, labelPos: 'ne' }); G.dot(t, 0, { r: 4, color: 'green', hollow: true }); }
          const th = ((Math.atan2(vv[1], vv[0]) + TAU) % Math.PI) * DEG;
          G.vline(th, { color: 'gold', width: 1.5 });
          G.dot(th, fa(th), { r: 4, color: 'blue' }); G.dot(th, fo(th), { r: 4, color: 'red' });
          if (!angs.length) G.corner('red curve never 0: no real eigenvalue', 'tr', { color: 'red', weight: 700 });
          st = { vv, Tv, along, off, ok, n: angs.length };
          v.legend([['gold', '$v$'], ['accent', '$Tv$'], ['red', 'part of $Tv$ off the line $\\mathbf Rv$'], ['blue', 'part along $v$'], ['green', 'eigen-direction']]);
        });
        v.readout(() => st && `$v = ${vecT(st.vv)},\\ Tv = ${vecT(st.Tv)},\\quad \\langle Tv, v\\rangle = ${nm(st.along, 3)},\\ \\det[v, Tv] = ${nm(st.off, 3)}$` + (st.ok ? ` — so $Tv = ${nm(st.along, 3)}\\,v$ and $\\lambda = ${nm(st.along, 3)}$ is an eigenvalue.` : st.n ? ` — not an eigenvector; the eigen-directions are the green lines.` : ` — no direction works: this rotation has no real eigenvalue.`));
      },
    },
    // ------------------------------------------------------------------ 5.7
    {
      num: '5.7',
      kind: 'Theorem',
      name: 'Equivalent conditions to be an eigenvalue',
      statement: String.raw`Suppose $V$ is finite-dimensional, $T \in \mathcal L(V)$ and $\lambda \in \mathbf F$. Then the following are equivalent:
(a) $\lambda$ is an eigenvalue of $T$;
(b) $T - \lambda I$ is not injective;
(c) $T - \lambda I$ is not surjective;
(d) $T - \lambda I$ is not invertible.`,
      idea: String.raw`$Tv = \lambda v$ is the same as $(T - \lambda I)v = 0$, so (a) says that $\operatorname{null}(T - \lambda I) \ne \{0\}$, which is (b). For an operator on a finite-dimensional space, injective, surjective and invertible are all equivalent (3.65, a consequence of the fundamental theorem of linear maps), which gives (b) ⟺ (c) ⟺ (d). In infinite dimensions the equivalence breaks.`,
      caption: String.raw`Drag $\lambda$ along the axis on the right (it snaps to eigenvalues). On the left, the unit square is mapped by $T - \lambda I$; the right panel plots its signed area. Exactly at an eigenvalue the image collapses onto a line: a nonzero vector (green) is killed — not injective — and the range (orange) misses most of the plane — not surjective. The rotation-like operator never collapses for real $\lambda$.`,
      deps: ['ladr-5.5', 'ladr-3.65'],
      tags: ['eigenvalues'],
      viz(v) {
        const PRE = { a: [[1.5, 0.5], [1, 1]], b: [[1, 0.6], [0, 1]], c: [[0.8, -0.9], [0.9, 0.8]] };
        const which = v.select('$T$', [{ value: 'a', label: 'eigenvalues $2, \\tfrac12$' }, { value: 'b', label: 'shear' }, { value: 'c', label: 'rotation-like' }], 'a');
        const S = v.stage({ x: [-2.2, 2.2], y: [-1.9, 1.9], equal: true, height: 340, title: 'the unit square under $T - \\lambda I$' });
        const G = v.stage({ x: [-1, 3], y: [-1.5, 2.5], height: 340, xlabel: 'λ', title: 'signed area $= \\det(T - \\lambda I)$' });
        const eigs = () => { const e = eig2x2(PRE[which.value]); return e.real ? e.l : []; };
        const L = G.handle(1.2, 0, { color: 'gold', label: 'λ', constrain: (x) => { for (const e of eigs()) if (Math.abs(x - e) < 0.05) x = e; return [x, 0]; } });
        let st = null;
        v.render(() => {
          const A = PRE[which.value], lam = L.x, B = [[A[0][0] - lam, A[0][1]], [A[1][0], A[1][1] - lam]], d = det2(col(B, 0), col(B, 1));
          const sing = Math.abs(d) < 1e-9;
          S.poly([[0, 0], [1, 0], [1, 1], [0, 1]], { color: 'muted', dash: [4, 4], fill: false, width: 1 });
          const a = col(B, 0), b = col(B, 1);
          let nul = null, ran = null;
          if (sing) {
            ran = len(a) > len(b) ? unit(a) : unit(b);
            nul = evec2(A, lam);
            S.line(-3 * ran[0], -3 * ran[1], 3 * ran[0], 3 * ran[1], { color: 'orange', width: 2, alpha: 0.8 });
            S.poly([[0, 0], a, add(a, b), b], { color: 'red', width: 4 });
            S.arrow(0, 0, nul[0], nul[1], { color: 'green', width: 3 });
            S.tex('v', nul[0], nul[1], { color: 'green', dx: 10, dy: -8 });
            S.tex('\\operatorname{range}', 1.75 * ran[0], 1.75 * ran[1], { color: 'orange', dx: 6, dy: 14, size: 13 });
          } else {
            S.poly([[0, 0], a, add(a, b), b], { fill: 'accent', fillAlpha: 0.18, color: 'accent', width: 1.6 });
            S.arrow(0, 0, a[0], a[1], { color: 'teal', width: 2 }); S.arrow(0, 0, b[0], b[1], { color: 'pink', width: 2 });
          }
          S.corner(sing ? 'collapsed: not injective, not surjective' : 'invertible', 'tl', { color: sing ? 'red' : 'accent', weight: 700 });
          const f = (x) => (A[0][0] - x) * (A[1][1] - x) - A[0][1] * A[1][0];
          G.fn(f, { color: 'accent', width: 2.4 });
          for (const e of eigs()) G.dot(e, 0, { r: 5, color: 'green' });
          G.vline(lam, { color: 'gold', width: 1, dash: [4, 4] });
          G.dot(lam, f(lam), { r: 4.5, color: sing ? 'red' : 'accent' });
          st = { lam, d, sing, nul, ran };
          v.legend([['accent', 'image of the unit square'], ['green', 'nonzero $v$ with $(T-\\lambda I)v = 0$'], ['orange', '$\\operatorname{range}(T - \\lambda I)$']]);
        });
        v.readout(() => {
          if (!st) return '';
          const head = `$\\lambda = ${nm(st.lam, 3)},\\quad \\det(T - \\lambda I) = ${nm(st.d, 3)}$ — `;
          return head + (st.sing ? `(a) $Tv = \\lambda v$ for $v = ${vecT(st.nul)}$; (b) $T - \\lambda I$ kills $v$, so it is not injective; (c) its range is the line through $${vecT(st.ran)}$, so it is not surjective; (d) hence not invertible.` : `$T - \\lambda I$ is injective, surjective and invertible, and $\\lambda$ is not an eigenvalue: all four conditions fail together.`);
        });
      },
    },
    // ------------------------------------------------------------------ 5.8
    {
      num: '5.8',
      kind: 'Definition',
      name: 'Eigenvector',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ and $\lambda \in \mathbf F$ is an eigenvalue of $T$. A vector $v \in V$ is an **eigenvector of $T$ corresponding to $\lambda$** if $v \ne 0$ and $Tv = \lambda v$. Equivalently, $v$ is a nonzero vector in $\operatorname{null}(T - \lambda I)$.`,
      idea: String.raw`Since $Tv = \lambda v \iff (T - \lambda I)v = 0$, the eigenvectors for $\lambda$ together with $0$ form the subspace $\operatorname{null}(T - \lambda I)$, the eigenspace $E(\lambda, T)$. Each line through $0$ inside it is mapped to itself by $T$ — the one-dimensional invariant subspaces are exactly the eigenvector lines. Over $\mathbf R$ an operator may have none (a rotation moves every line), while its eigenvalues as a complex matrix still exist, as a conjugate pair.`,
      caption: String.raw`Drag $Te_1$ (teal) and $Te_2$ (pink) to edit $T$; the dashed circle goes to the blue ellipse. Drag $v$ to choose a line through $0$ (gold); its image $T(\text{line})$ is the orange line. Eigenvector lines (green) are where the two coincide. Drag towards a rotation and watch the green lines meet and vanish while the eigenvalues in the $\mathbf C$ panel leave the real axis as a conjugate pair; the scalar preset makes every line an eigenline.`,
      deps: ['ladr-5.5'],
      tags: ['eigenvalues'],
      viz(v) {
        const PRE = { gen: [[1.2, 0.8], [0.3, 0.6]], sym: [[1.3, 0.6], [0.6, 0.4]], shear: [[1, 0.7], [0, 1]], rot: [[0.5, -0.9], [0.9, 0.5]], scalar: [[1.2, 0], [0, 1.2]] };
        v.select('preset', Object.keys(PRE), 'gen', { onChange: (k) => C.set(PRE[k]) });
        const S = v.stage({ x: [-2.3, 2.3], y: [-2, 2], equal: true, height: 380, weight: 1.5 });
        const Z = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 380, weight: 0.85, title: 'eigenvalues in $\\mathbf C$' });
        const C = colHandles(S, PRE.gen);
        const vh = S.handle(Math.cos(2), Math.sin(2), { color: 'gold', label: 'v', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; } });
        let st = null;
        v.render(() => {
          const A = C.A, e = eig2x2(A);
          drawEllipse(S, A);
          drawCols(S, A, { alpha: 0 });
          const lines = [];
          if (e.real) for (const l of e.l) {
            const u = evec2(A, l);
            if (!u) { for (let k = 0; k < 12; k++) { const t = (Math.PI * k) / 12; S.line(-3 * Math.cos(t), -3 * Math.sin(t), 3 * Math.cos(t), 3 * Math.sin(t), { color: 'green', width: 1.2, alpha: 0.5 }); } lines.push({ l, u: null }); continue; }
            S.line(-3 * u[0], -3 * u[1], 3 * u[0], 3 * u[1], { color: 'green', width: 2.6, alpha: 0.85 });
            S.arrow(0, 0, l * u[0], l * u[1], { color: 'green', width: 3 });
            const s = Math.abs(u[1] / (u[0] || 1e-9)) > 0.8 ? 1.65 : 2.05, q = u[1] < 0 ? -1 : 1;
            S.tex(`E(${nm(l)})`, q * s * u[0], q * s * u[1], { color: 'green', dx: 22, size: 14 });
            lines.push({ l, u });
          }
          const vv = [vh.x, vh.y], Tv = mv(A, vv), tu = len(Tv) > 1e-9 ? unit(Tv) : vv;
          S.line(-3 * vv[0], -3 * vv[1], 3 * vv[0], 3 * vv[1], { color: 'gold', width: 1.6 });
          S.line(-3 * tu[0], -3 * tu[1], 3 * tu[0], 3 * tu[1], { color: 'orange', width: 1.6, dash: [7, 5] });
          S.arrow(0, 0, Tv[0], Tv[1], { color: 'orange', width: 2.4 });
          S.arrow(0, 0, vv[0], vv[1], { color: 'gold', width: 2.4 });
          S.tex('Tv', Tv[0], Tv[1], { color: 'orange', dx: 14, dy: 10 });
          const turn = Math.asin(Math.min(1, Math.abs(det2(vv, tu)))) * DEG;
          S.corner(e.real ? `${lines.length && !lines[0].u ? 'every line' : lines.length + (lines.length === 1 ? ' line' : ' lines')} mapped onto itself` : 'no real eigenvector: every line is turned', 'tl', { color: e.real ? 'green' : 'red', weight: 700 });
          // complex plane
          Z.circle(0, 0, 1, { color: 'faint', dash: [3, 4] });
          const zs = e.real ? e.l.map((l) => [l, 0]) : [[e.re, e.im], [e.re, -e.im]];
          if (!e.real) Z.line(e.re, e.im, e.re, -e.im, { color: 'red', dash: [3, 4], width: 1 });
          zs.forEach(([x, y], i) => Z.dot(x, y, { r: 6, color: e.real ? 'green' : 'red', label: e.real && e.l.length === 1 ? 'λ (double)' : `λ${'₁₂'[i]}`, labelPos: y < 0 ? 'se' : 'ne' }));
          st = { A, e, lines, turn };
          v.legend([['accent', 'image of the unit circle'], ['gold', 'a line'], ['orange', 'its image', { dash: true }], ['green', 'eigenvector lines']]);
        });
        v.readout(() => {
          if (!st) return '';
          const { A, e, lines, turn } = st;
          let s = `$T = ${matT(A, 1)}$; the gold line is turned by $${nm(turn, 1)}^\\circ$. `;
          if (!e.real) return s + `Eigenvalues $${cxT(e.re, e.im)}$ and $${cxT(e.re, -e.im)}$ are not real: over $\\mathbf R$ there are no eigenvectors.`;
          if (lines.length && !lines[0].u) return s + `$T = ${nm(e.l[0])}I$: every nonzero vector is an eigenvector.`;
          return s + lines.map(({ l, u }) => `$\\lambda = ${nm(l, 3)}$: eigenvector $${vecT(u)}$`).join(', ') + (lines.length === 1 ? ' — a repeated eigenvalue with only one eigen-line.' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 5.11
    {
      num: '5.11',
      kind: 'Theorem',
      name: 'Linearly independent eigenvectors',
      statement: String.raw`Suppose $T \in \mathcal L(V)$. Then every list of eigenvectors of $T$ corresponding to distinct eigenvalues of $T$ is linearly independent.`,
      idea: String.raw`If not, take the smallest $k$ such that $v_k \in \operatorname{span}(v_1, \dots, v_{k-1})$ (linear dependence lemma, 2.19), say $v_k = a_1v_1 + \dots + a_{k-1}v_{k-1}$. Apply $T - \lambda_kI$: the left side becomes $0$ and the right side $\sum a_j(\lambda_j - \lambda_k)v_j$. Since $v_1, \dots, v_{k-1}$ are independent, every $a_j(\lambda_j - \lambda_k) = 0$, and since the eigenvalues are distinct every $a_j = 0$, forcing $v_k = 0$ — impossible for an eigenvector.`,
      caption: String.raw`Here $T$ is upper-triangular with diagonal $\lambda_1, \lambda_2, \lambda_3$ (its eigenvalues). The three unit eigenvectors span the green box. Slide two eigenvalues towards each other: the box flattens, and its volume tends to $0$; when they become equal, the two eigenvectors merge into one and the box turns red — with a repeated eigenvalue the conclusion can fail. Drag the background to rotate.`,
      deps: ['ladr-5.8', 'ladr-2.15', 'ladr-2.19'],
      tags: ['eigenvalues', 'independence'],
      viz(v) {
        const L1 = v.slider('$\\lambda_1$', -1.5, 1.5, -0.9, { step: 0.05 });
        const L2 = v.slider('$\\lambda_2$', -1.5, 1.5, 0.35, { step: 0.05 });
        const L3 = v.slider('$\\lambda_3$', -1.5, 1.5, 1.2, { step: 0.05 });
        const S = v.stage({ x: [-1.8, 1.8], y: [-1.6, 1.6], equal: true, axes: false, height: 400 });
        const sc = v.scene3(S, { yaw: -0.55, pitch: 0.32, axis: 1.35 });
        let st = null;
        v.render(() => {
          const a = Math.round(L1.value * 20) / 20, b = Math.round(L2.value * 20) / 20, c = Math.round(L3.value * 20) / 20;
          const vs = [[1, 0, 0]];
          vs.push(b !== a ? unit([1 / (b - a), 1, 0]) : null);
          if (c !== b && c !== a) { const y = 1 / (c - b); vs.push(unit([(y + 0.8) / (c - a), y, 1])); } else vs.push(null);
          const ls = [a, b, c], cols = ['accent', 'orange', 'purple'], got = vs.filter(Boolean);
          sc.begin();
          vs.forEach((w, i) => {
            if (!w) return;
            sc.line(scl(w, -1.6), scl(w, 1.6), { color: cols[i], width: 1, alpha: 0.35 });
            sc.arrow([0, 0, 0], w, { color: cols[i] });
            sc.arrow([0, 0, 0], scl(w, ls[i]), { color: cols[i], width: 1.4, alpha: 0.55, head: 7 });
            sc.tex(`v_${i + 1}`, w, { color: cols[i], dx: 12, dy: -8 });
          });
          let vol = 0;
          if (got.length === 3) {
            const [p, q, r] = got; vol = Math.abs(dot(p, cross(q, r)));
            const o = [0, 0, 0], fc = vol > 1e-6 ? 'green' : 'red';
            const F = [[o, p, add(p, q), q], [o, q, add(q, r), r], [o, r, add(r, p), p], [r, add(r, p), add(add(p, q), r), add(q, r)], [p, add(p, q), add(add(p, q), r), add(p, r)], [q, add(q, r), add(add(p, q), r), add(p, q)]];
            F.forEach((f) => sc.poly(f, { fill: fc, fillAlpha: 0.08, color: fc, alpha: 0.4, width: 0.8 }));
          } else if (got.length === 2) {
            const [e1, e2] = onb(got[0], got[1]);
            sc.disc(e1, e2, 1.2, { fill: 'red', fillAlpha: 0.08, color: 'red', grid: true });
          }
          sc.flush();
          S.corner(got.length === 3 ? `det[v₁ v₂ v₃] = ${nmc(vol, 3)}` : `only ${got.length} independent eigenvectors`, 'tl', { color: got.length === 3 ? (vol > 0.15 ? 'green' : 'orange') : 'red', weight: 700 });
          st = { a, b, c, vol, n: got.length };
          v.legend([['accent', '$v_1$, $\\lambda_1 v_1$'], ['orange', '$v_2$, $\\lambda_2 v_2$'], ['purple', '$v_3$, $\\lambda_3 v_3$'], ['green', 'box spanned', { area: true }]]);
        });
        v.readout(() => {
          if (!st) return '';
          const T = `T = \\begin{pmatrix}${nm(st.a)} & 1 & 0.8 \\\\ 0 & ${nm(st.b)} & 1 \\\\ 0 & 0 & ${nm(st.c)}\\end{pmatrix}`;
          return st.n === 3 ? `$${T}$: distinct eigenvalues, and the unit eigenvectors have $|\\det[v_1\\ v_2\\ v_3]| = ${nm(st.vol, 4)} \\ne 0$ — linearly independent.` : `$${T}$: a repeated eigenvalue. Its eigenspace is only a line, so there are just ${st.n} independent eigenvectors — the hypothesis "distinct" was needed.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.12
    {
      num: '5.12',
      kind: 'Theorem',
      name: 'At most dim V distinct eigenvalues',
      statement: String.raw`Suppose $V$ is finite-dimensional. Then each operator on $V$ has at most $\dim V$ distinct eigenvalues.`,
      idea: String.raw`Pick one eigenvector for each distinct eigenvalue. By 5.11 this list is linearly independent, and in a finite-dimensional space no linearly independent list is longer than a spanning list (2.22), hence no longer than $\dim V$. So the number of distinct eigenvalues is at most $\dim V$.`,
      caption: String.raw`Edit the matrix: drag an entry up or down, or click the top or bottom half of a cell, or press *random*. All eigenvalues (as a complex matrix) are plotted in $\mathbf C$, with multiplicities. However you edit, never more than $n = \dim V$ distinct points appear, and one eigenvector per point always gives an independent list (rank in the readout). Switch $n$ to see the bound move.`,
      deps: ['ladr-5.11', 'ladr-2.22'],
      tags: ['eigenvalues'],
      viz(v) {
        const M = v.M;
        const START = { 2: [[1, 1.5], [1, -0.5]], 3: [[2, 1, 0], [-1, 0.5, 1], [0, 0.5, -1]], 4: [[1, 1, 0, 0], [-1, 1, 0.5, 0], [0, 0, -1.5, 1], [0.5, 0, 0, 2]] };
        let A = clone(START[3]), seed = 7;
        const n = v.select('$n = \\dim V$', ['2', '3', '4'], '3', { onChange: (k) => { A = clone(START[k]); } });
        v.button('random', () => { const r = v.rng(seed++), k = A.length; A = Array.from({ length: k }, () => Array.from({ length: k }, () => r.int(-6, 6) / 2)); });
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1, title: 'drag or click an entry' });
        const Z = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 300, weight: 1.2, title: 'eigenvalues in $\\mathbf C$' });
        const draw = matEditor(E, () => A, { step: 0.5, lim: 3 });
        let st = null;
        v.render(() => {
          draw();
          const k = A.length, ev = M.eig(A), gs = groupRoots(ev.values.map((z) => ({ re: z.re, im: z.im })));
          const R = Math.max(3, 1.25 * Math.max(...gs.map((g) => Math.hypot(g.re, g.im))));
          Z.setView([-R, R], [-R, R]);
          for (const g of gs) Z.dot(g.re, g.im, { r: 6 + 2 * (g.m - 1), color: g.im ? 'purple' : 'green', label: g.m > 1 ? `×${g.m}` : '', labelPos: 'ne' });
          Z.corner(`${gs.length} distinct ≤ ${k} = dim V`, 'tl', { color: 'green', weight: 700 });
          // one eigenvector per distinct eigenvalue → rank over C via the real embedding
          const picks = gs.map((g) => ev.values.findIndex((z) => Math.hypot(z.re - g.re, z.im - g.im) < 1e-2 * (1 + Math.hypot(g.re, g.im))));
          const W = picks.map((i) => ev.cvectors[i]).filter(Boolean);
          const Rm = [];
          for (let r = 0; r < 2 * k; r++) Rm.push(W.flatMap((w) => (r < k ? [w.re[r], -w.im[r]] : [w.im[r - k], w.re[r - k]])));
          const rk = W.length ? Math.round(M.rank(Rm, 1e-7) / 2) : 0;
          st = { gs, k, rk };
          v.legend([['green', 'real eigenvalue'], ['purple', 'non-real eigenvalue']]);
        });
        v.readout(() => st && `Eigenvalues: $${st.gs.map((g) => cxT(g.re, g.im) + (g.m > 1 ? `\\ (\\times${g.m})` : '')).join(',\\ ')}$ — ${st.gs.length} distinct, and one eigenvector for each gives a list of rank ${st.rk}: independent (5.11), so its length is at most $\\dim V = ${st.k}$ (2.22).`);
      },
    },
    // ------------------------------------------------------------------ 5.17
    {
      num: '5.17',
      kind: 'Theorem',
      name: 'Multiplicative properties of p(T)',
      statement: String.raw`Suppose $p, q \in \mathcal P(\mathbf F)$ and $T \in \mathcal L(V)$. Then
(a) $(pq)(T) = p(T)\,q(T)$;
(b) $p(T)\,q(T) = q(T)\,p(T)$.
Here $p(T) = a_0I + a_1T + \dots + a_mT^m$ when $p(z) = a_0 + a_1z + \dots + a_mz^m$.`,
      idea: String.raw`Write $p = \sum_j a_jz^j$ and $q = \sum_k b_kz^k$. Then $pq = \sum_{j,k} a_jb_kz^{j+k}$, and since $T^jT^k = T^{j+k}$ and composition distributes over sums (3.8),
$$p(T)q(T) = \sum_{j,k} a_jb_k\,T^{j+k} = (pq)(T).$$
Part (b) follows from (a) because $pq = qp$ as polynomials. Two polynomials in the *same* operator always commute; polynomials in different operators need not.`,
      caption: String.raw`Drag $Te_1$ and $Te_2$ on the left to change $T$, and the sliders to change $p(z) = z - a$ and $q(z) = z^2 - b$. On the right the grid is mapped by $(pq)(T)$ (blue), $p(T)q(T)$ (orange dashed) and $q(T)p(T)$ (green dotted): always one and the same picture. Switch on the toggle to put $q$ on a different operator $S$ (a shear): now $p(T)q(S)$ and $q(S)p(T)$ come apart.`,
      deps: ['ladr-5.1', 'ladr-2.10', 'ladr-3.8'],
      tags: ['polynomials', 'operators'],
      viz(v) {
        const a = v.slider('$p(z) = z - a$, $a$', -2, 2, 0.5, { step: 0.1 });
        const b = v.slider('$q(z) = z^2 - b$, $b$', -2, 2, 1, { step: 0.1 });
        const other = v.toggle('apply $q$ to another operator $S$', false);
        const S1 = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, height: 340, title: '$T$ acting on the grid' });
        const S2 = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 340, title: 'the products' });
        const C = colHandles(S1, [[0.8, -0.6], [0.5, 0.9]]);
        const Sop = [[1, 0.9], [0, 1]];
        let st = null;
        v.render(() => {
          const A = C.A, pc = [-a.value, 1], qc = [-b.value, 0, 1];
          const P = polyMat(pc, A), Q = polyMat(qc, other.value ? Sop : A);
          const PQ = mm(P, Q), QP = mm(Q, P), X = polyMat(pmul(pc, qc), A);
          gridImage(S1, A, { color: 'accent', alpha: 0.3 });
          drawCols(S1, A);
          const sq = (B) => [[0, 0], col(B, 0), add(col(B, 0), col(B, 1)), col(B, 1)];
          const ext = Math.max(...[PQ, QP].flatMap((B) => sq(B).flat().map(Math.abs)));
          const R = Math.min(14, Math.max(2.5, 1.25 * ext));
          S2.setView([-R, R], [-R, R]);
          gridImage(S2, PQ, { color: 'accent', alpha: 0.25 });
          S2.poly(sq(PQ), { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2 });
          S2.poly(sq(QP), { color: other.value ? 'red' : 'orange', width: 2.4, dash: [8, 6], fill: other.value ? 'red' : false, fillAlpha: 0.12 });
          if (!other.value) S2.poly(sq(X), { color: 'green', width: 2.4, dash: [2, 5] });
          S2.setTitle(other.value ? 'image of the unit square: $p(T)q(S)$ vs $q(S)p(T)$' : 'image of the unit square under $(pq)(T)$');
          const diff = fro(msub(PQ, QP)) + (other.value ? 0 : fro(msub(PQ, X)));
          S2.corner(diff < 1e-9 ? 'all coincide' : `they differ: ‖difference‖ = ${nmc(fro(msub(PQ, QP)), 3)}`, 'tl', { color: diff < 1e-9 ? 'green' : 'red', weight: 700 });
          st = { PQ, QP, X, diff, o: other.value };
          v.legend(other.value ? [['accent', '$p(T)\\,q(S)$'], ['red', '$q(S)\\,p(T)$', { dash: true }]] : [['accent', '$(pq)(T)$'], ['orange', '$p(T)\\,q(T)$', { dash: true }], ['green', '$q(T)\\,p(T)$', { dash: true }]]);
        });
        v.readout(() => {
          if (!st) return '';
          const pq = polyT(pmul([-a.value, 1], [-b.value, 0, 1]));
          if (st.o) return `$p(T)q(S) = ${matT(st.PQ)} \\ne q(S)p(T) = ${matT(st.QP)}$ — polynomials in different operators need not commute.`;
          return `$(pq)(z) = ${pq}$; $\\ p(T)q(T) = ${matT(st.PQ)},\\ q(T)p(T) = ${matT(st.QP)},\\ (pq)(T) = ${matT(st.X)}$ — equal (difference $${nm(st.diff, 9)}$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.18
    {
      num: '5.18',
      kind: 'Theorem',
      name: 'Null space and range of p(T) are invariant under T',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ and $p \in \mathcal P(\mathbf F)$. Then $\operatorname{null} p(T)$ and $\operatorname{range} p(T)$ are invariant under $T$.`,
      idea: String.raw`Everything rests on $T$ commuting with $p(T)$ (5.17 with $q(z) = z$). If $p(T)u = 0$ then $p(T)(Tu) = T\,p(T)u = T0 = 0$, so $Tu \in \operatorname{null} p(T)$. If $u = p(T)w$ then $Tu = T\,p(T)w = p(T)(Tw)$, which lies in $\operatorname{range} p(T)$.`,
      caption: String.raw`$T$ acts on $\mathbf R^3$ with a rotation-like plane (eigenvalues $0.6 \pm i$) and a stretched line (eigenvalue $1.5$). Choose $p$: the null space of $p(T)$ (blue) and its range (orange) are drawn. Drag $u$ inside the null space and $w$ inside the range: $Tu$ and $Tw$ (green) never leave. The toggle replaces $p(T)$ by a projection $S$ that does not commute with $T$, and its null space and range are no longer invariant (red).`,
      deps: ['ladr-5.17', 'ladr-5.2'],
      tags: ['invariant subspaces'],
      viz(v) {
        const M = v.M;
        const P = [[1, 0.3, 0.25], [0.1, 1, 0.35], [0.3, -0.1, 1]], T = mm(mm(P, [[0.6, -1, 0], [1, 0.6, 0], [0, 0, 1.5]]), M.inverse(P));
        const POLYS = { a: { c: [-1.5, 1], t: 'z - 1.5' }, b: { c: [1.36, -1.2, 1], t: 'z^2 - 1.2z + 1.36' }, c: { c: [-1, 1], t: 'z - 1' }, d: { c: pmul([-1.5, 1], [1.36, -1.2, 1]), t: '(z - 1.5)(z^2 - 1.2z + 1.36)' } };
        const which = v.select('$p(z) =$', Object.entries(POLYS).map(([value, p]) => ({ value, label: `$${p.t}$` })), 'a');
        const brk = v.toggle('use a projection $S$ instead of $p(T)$', false);
        const n0 = unit([1, -0.7, 0.5]), Sop = eye(3).map((r, i) => r.map((x, j) => x - n0[i] * n0[j]));
        const S = v.stage({ x: [-2, 2], y: [-1.8, 1.8], equal: true, axes: false, height: 410 });
        const sc = v.scene3(S, { yaw: -0.75, pitch: 0.3, axis: 1.5 });
        const hu = sc.handle([0.5, 0.5, 0.5], { color: 'accent', label: 'u' });
        const hw = sc.handle([0.5, -0.5, 0.5], { color: 'orange', label: 'w' });
        const fit = (H, basis, p0) => {
          H.h.visible = basis.length > 0;
          if (basis.length === 1) { H.mode = 'line'; H.d = basis[0]; H.set(scl(basis[0], 0.9 * Math.sign(dot(p0, basis[0]) || 1))); }
          else if (basis.length === 2) { H.mode = 'plane'; H.a = basis[0]; H.b = basis[1]; let p = add(scl(basis[0], dot(p0, basis[0])), scl(basis[1], dot(p0, basis[1]))); if (len(p) < 0.3) p = scl(basis[0], 0.9); H.set(p); }
          else if (basis.length === 3) { H.mode = 'free'; H.set(p0); }
        };
        let key = '', st = null;
        v.render(() => {
          const Q = brk.value ? Sop : polyMat(POLYS[which.value].c, T);
          const sv = M.svd(Q), big = Math.max(1, sv.S[0]);
          const nul = M.nullspace(Q, 1e-8 * big), ran = sv.S.map((s, k) => (s > 1e-8 * big ? col(sv.U, k) : null)).filter(Boolean);
          const k2 = which.value + brk.value;
          if (k2 !== key) { key = k2; fit(hu, nul, [0.7, 0.6, 0.5]); fit(hw, ran, [0.6, -0.6, 0.6]); }
          sc.begin();
          const drawSub = (B, c) => {
            if (B.length === 1) sc.line(scl(B[0], -1.8), scl(B[0], 1.8), { color: c, width: 3.4 });
            else if (B.length === 2) sc.disc(B[0], B[1], 1.45, { fill: c, fillAlpha: 0.13, color: c, grid: true });
          };
          drawSub(nul, 'accent'); drawSub(ran, 'orange');
          const inNul = (x) => len(mv(Q, x)) < 1e-6 * (1 + len(x));
          const inRan = (x) => len(sub(x, ran.reduce((s, r) => add(s, scl(r, dot(x, r))), [0, 0, 0]))) < 1e-6 * (1 + len(x));
          let okU = null, okW = null;
          if (nul.length) { const Tu = mv(T, hu.p); okU = inNul(Tu); sc.arrow([0, 0, 0], hu.p, { color: 'accent' }); sc.arrow([0, 0, 0], Tu, { color: okU ? 'green' : 'red' }); sc.tex('Tu', Tu, { color: okU ? 'green' : 'red', dx: 14, dy: -6 }); }
          if (ran.length) { const Tw = mv(T, hw.p); okW = inRan(Tw); sc.arrow([0, 0, 0], hw.p, { color: 'orange' }); sc.arrow([0, 0, 0], Tw, { color: okW ? 'green' : 'red' }); sc.tex('Tw', Tw, { color: okW ? 'green' : 'red', dx: 14, dy: -6 }); }
          sc.flush();
          const dn = ['{0}', 'a line', 'a plane', 'all of ℝ³'];
          S.corner(`null: ${dn[nul.length]} · range: ${dn[ran.length]}`, 'tl', { color: 'muted', weight: 700 });
          st = { okU, okW, nn: nul.length, nr: ran.length, b: brk.value };
          v.legend([['accent', `null ${brk.value ? '$S$' : '$p(T)$'}`, { area: true }], ['orange', `range ${brk.value ? '$S$' : '$p(T)$'}`, { area: true }], ['green', 'image stays inside'], ['red', 'image escapes']]);
        });
        v.readout(() => {
          if (!st) return '';
          const name = st.b ? 'S' : 'p(T)';
          const part = (ok, w, sp) => (ok === null ? `$\\operatorname{${sp}} ${name}$ is ${sp === 'null' ? (st.nn ? '' : '$\\{0\\}$') : (st.nr ? '' : '$\\{0\\}$')} (trivially invariant)` : ok ? `$T${w} \\in \\operatorname{${sp}} ${name}$ ✓` : `$T${w} \\notin \\operatorname{${sp}} ${name}$ ✗`);
          return `${part(st.okU, 'u', 'null')}; ${part(st.okW, 'w', 'range')}.` + (st.b ? ' $S$ is not a polynomial in $T$ and does not commute with it, so the proof breaks.' : ' Both subspaces are invariant, because $T$ commutes with $p(T)$.');
        });
      },
    },
    // ------------------------------------------------------------------ 5.19
    {
      num: '5.19',
      kind: 'Theorem',
      name: 'Existence of eigenvalues',
      statement: String.raw`Every operator on a finite-dimensional nonzero complex vector space has an eigenvalue.`,
      idea: String.raw`Let $n = \dim V > 0$ and pick $v \ne 0$. The $n+1$ vectors $v, Tv, \dots, T^nv$ are linearly dependent (2.22), so there is a nonconstant polynomial $p$ of smallest degree with $p(T)v = 0$. By the fundamental theorem of algebra (4.12) $p$ has a zero $\lambda \in \mathbf C$, so $p(z) = (z - \lambda)q(z)$ (4.6), and by 5.17
$$0 = p(T)v = (T - \lambda I)\bigl(q(T)v\bigr).$$
Since $\deg q < \deg p$, the vector $q(T)v$ is not $0$, so it is an eigenvector for $\lambda$. Over $\mathbf R$ the polynomial $p$ may have no zero (an irreducible quadratic), and the proof — and the theorem — fail.`,
      caption: String.raw`Edit $T$ with $Te_1$, $Te_2$ and drag $v$ (gold). Three vectors $v, Tv, T^2v$ in a 2-dimensional space are always dependent, giving $p$ with $p(T)v = 0$; its zeros are plotted in $\mathbf C$ and they are eigenvalues. Drag towards a rotation: the real eigen-lines (green) vanish but the zeros just move off the axis as a conjugate pair. Switch to $\mathbf F = \mathbf R$ to see that then nothing is left.`,
      deps: ['ladr-4.12', 'ladr-4.6', 'ladr-5.17', 'ladr-5.5', 'ladr-2.22'],
      tags: ['eigenvalues'],
      viz(v) {
        const PRE = { rot: [[0.5, -0.9], [0.9, 0.5]], real: [[1.2, 0.5], [0.4, 0.4]], shear: [[0.8, 0.6], [0, 0.8]] };
        const F = v.select('field', [{ value: 'C', label: '$\\mathbf F = \\mathbf C$' }, { value: 'R', label: '$\\mathbf F = \\mathbf R$' }], 'C');
        v.select('preset', [{ value: 'rot', label: 'rotation-like' }, { value: 'real', label: 'real eigenvalues' }, { value: 'shear', label: 'shear' }], 'rot', { onChange: (k) => C.set(PRE[k]) });
        const S = v.stage({ x: [-2.4, 2.4], y: [-2, 2], equal: true, height: 360, weight: 1.4 });
        const Z = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 360, weight: 0.9, title: 'zeros of $p$ in $\\mathbf C$' });
        const C = colHandles(S, PRE.rot);
        const vh = S.handle(1.1, 0.35, { color: 'gold', label: 'v' });
        let st = null;
        v.render(() => {
          const A = C.A, w0 = [vh.x, vh.y], w1 = mv(A, w0), w2 = mv(A, w1), D = det2(w0, w1);
          let pc, zs;
          if (Math.abs(D) < 1e-9 * (1 + len(w0) * len(w1))) { const l = dot(w1, w0) / dot(w0, w0); pc = [-l, 1]; zs = [[l, 0]]; }
          else {
            const a0 = det2(scl(w2, -1), w1) / D, a1 = det2(w0, scl(w2, -1)) / D, disc = (a1 * a1) / 4 - a0;
            pc = [a0, a1, 1];
            zs = disc >= 0 ? [[-a1 / 2 + Math.sqrt(disc), 0], [-a1 / 2 - Math.sqrt(disc), 0]] : [[-a1 / 2, Math.sqrt(-disc)], [-a1 / 2, -Math.sqrt(-disc)]];
          }
          const real = zs.every((z) => Math.abs(z[1]) < 1e-12), overR = F.value === 'R';
          drawCols(S, A, { alpha: 0.04 });
          if (real) for (const [l] of zs) { const u = evec2(A, l); if (u) S.line(-3 * u[0], -3 * u[1], 3 * u[0], 3 * u[1], { color: 'green', width: 2, alpha: 0.75 }); }
          [[w0, 'gold', 'v'], [w1, 'orange', 'Tv'], [w2, 'red', 'T^2v']].forEach(([w, c, s]) => { S.arrow(0, 0, w[0], w[1], { color: c, width: 2.6 }); S.tex(s, w[0], w[1], { color: c, dx: 14, dy: -10 }); });
          S.corner(real ? 'real eigen-lines (green)' : 'no line is mapped to itself', 'tl', { color: real ? 'green' : 'red', weight: 700 });
          Z.circle(0, 0, 1, { color: 'faint', dash: [3, 4] });
          const R = Math.max(2, 1.25 * Math.max(...zs.map(([x, y]) => Math.hypot(x, y))));
          Z.setView([-R, R], [-R, R]);
          const dead = overR && !real;
          if (!real) Z.line(zs[0][0], zs[0][1], zs[1][0], zs[1][1], { color: dead ? 'faint' : 'accent', dash: [3, 4], width: 1 });
          zs.forEach(([x, y], i) => Z.dot(x, y, { r: 6, color: dead ? 'red' : 'green', hollow: dead, label: `λ${'₁₂'[i]}`, labelPos: y < 0 ? 'se' : 'ne' }));
          if (dead) Z.corner('not in F = ℝ', 'tl', { color: 'red', weight: 700 });
          st = { A, pc, zs, real, dead };
          v.legend([['gold', '$v$'], ['orange', '$Tv$'], ['red', '$T^2v$'], ['green', 'eigenvalue / eigen-line']]);
        });
        v.readout(() => {
          if (!st) return '';
          const { A, pc, zs, real, dead } = st, [[a, b], [c, d]] = A;
          const fac = zs.map(([x, y]) => `(z - ${y ? `(${cxT(x, y)})` : nm(x, 3)})`).join('');
          let s = `$p(T)v = 0$ for $p(z) = ${polyT(pc, 'z', 3)} = ${fac}$. `;
          if (dead) return s + 'Over $\\mathbf R$ this quadratic is irreducible: no factor $T - \\lambda I$ with real $\\lambda$ appears, and indeed $T$ has no real eigenvalue.';
          const chk = zs.map(([x, y]) => Math.hypot((a - x) * (d - x) - y * y - b * c, -y * (a - x) - y * (d - x))).reduce((m, t) => Math.max(m, t), 0);
          s += `So $(T - \\lambda_1 I)${zs.length > 1 ? '(T - \\lambda_2 I)' : ''}v = 0$ and some factor is not injective. Check: $\\max_j |\\det(T - \\lambda_j I)| = ${nm(chk, 6)}$`;
          if (!real && Math.abs(b) > 1e-9) { const [x, y] = zs[0]; s += `; an eigenvector for $\\lambda_1$ in $\\mathbf C^2$ is $(${nm(b)},\\ ${cxT(x - a, y)})$`; }
          return s + '.';
        });
      },
    },
    // ------------------------------------------------------------------ 5.22
    {
      num: '5.22',
      kind: 'Theorem',
      name: 'Existence, uniqueness, degree of minimal polynomial',
      statement: String.raw`Suppose $V$ is finite-dimensional and $T \in \mathcal L(V)$. Then there is a unique monic polynomial $p \in \mathcal P(\mathbf F)$ of smallest degree such that $p(T) = 0$. Moreover $\deg p \le \dim V$.`,
      idea: String.raw`Induction on $\dim V$. Pick $u \ne 0$ and let $m$ be the first index with $T^mu \in \operatorname{span}(u, \dots, T^{m-1}u)$; this gives a monic $q_u$ of degree $m \le \dim V$ with $q_u(T)u = 0$. Then $\operatorname{null} q_u(T)$ contains $u, Tu, \dots, T^{m-1}u$, so it has dimension at least $m$, and $\operatorname{range} q_u(T)$ is invariant (5.18) of dimension $\le \dim V - m$ (3.21). By induction some monic $s$ of degree $\le \dim V - m$ kills $T$ on that range, and then $sq_u$ kills $T$, with degree $\le \dim V$. If two monic polynomials of the least degree both kill $T$, their difference kills $T$ and has smaller degree, so it is $0$.`,
      caption: String.raw`Drag $u$ (gold) in $\mathbf R^3$ and watch $u, Tu, T^2u, T^3u$. The green span is where the list first becomes dependent: a line if $u$ is an eigenvector, a plane if $u$ lies in an invariant plane (the handle snaps to these), otherwise all of $\mathbf R^3$. The dependency is the monic $q_u$ with $q_u(T)u = 0$, of degree at most $3 = \dim V$, and it always divides the minimal polynomial. For "repeated eigenvalue" no $u$ needs degree 3.`,
      deps: ['ladr-2.19', 'ladr-5.18', 'ladr-3.21'],
      tags: ['minimal polynomial'],
      viz(v) {
        const M = v.M;
        const P = [[1, 0.4, 0.1], [0.2, 1, 0.3], [-0.1, 0.3, 1]], Pi = M.inverse(P), pc = (j) => unit(col(P, j));
        const PRE = {
          dist: { B: [[1.2, 0, 0], [0, 0.75, 0], [0, 0, -0.6]], lines: [0, 1, 2], planes: [[0, 1], [0, 2], [1, 2]] },
          rep: { B: [[0.9, 0, 0], [0, 0.9, 0], [0, 0, -0.6]], lines: [2], planes: [[0, 1]] },
          jord: { B: [[0.9, 1, 0], [0, 0.9, 0], [0, 0, -0.6]], lines: [0, 2], planes: [[0, 1], [0, 2]] },
        };
        for (const k in PRE) PRE[k].T = mm(mm(P, PRE[k].B), Pi);
        const which = v.select('$T$', [{ value: 'dist', label: 'distinct eigenvalues' }, { value: 'rep', label: 'repeated eigenvalue' }, { value: 'jord', label: 'Jordan block' }], 'dist');
        const S = v.stage({ x: [-2, 2], y: [-1.8, 1.8], equal: true, axes: false, height: 410 });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.3, axis: 1.5 });
        const snap = (p) => {
          const pre = PRE[which.value], r = len(p); if (r < 1e-6) return p;
          for (const j of pre.lines) { const d = pc(j), c = dot(p, d) / r; if (Math.abs(c) > Math.cos(6 / DEG)) return scl(d, Math.sign(c) * r); }
          for (const [i, j] of pre.planes) { const nn = unit(cross(pc(i), pc(j))), h = dot(p, nn); if (Math.abs(h) / r < Math.sin(5 / DEG)) return scl(unit(sub(p, scl(nn, h))), r); }
          return p;
        };
        const hu = sc.handle([0.9, 0.3, 0.6], { color: 'gold', label: 'u', snap });
        let st = null;
        v.render(() => {
          const T = PRE[which.value].T, K = [hu.p];
          for (let j = 0; j < 3; j++) K.push(mv(T, K[j]));
          // first m with K[m] in span(K[0..m-1])
          let m = 3; const Q = [];
          for (let j = 0; j <= 3; j++) {
            let w = K[j].slice(); for (const q of Q) w = sub(w, scl(q, dot(w, q)));
            if (len(w) < 1e-6 * (1 + len(K[j]))) { m = j; break; }
            Q.push(unit(w));
          }
          const Am = [0, 1, 2].map((r) => K.slice(0, m).map((w) => w[r])), x = M.lstsq(Am, K[m]), qu = [...x.map((t) => -t), 1];
          const mp = minPoly(M, T).c, rem = pdiv(mp, qu).r, divides = rem.every((t) => Math.abs(t) < 1e-6);
          sc.begin();
          if (m === 1) sc.line(scl(Q[0], -1.8), scl(Q[0], 1.8), { color: 'green', width: 3.5 });
          if (m === 2) sc.disc(Q[0], Q[1], 1.5, { fill: 'green', fillAlpha: 0.12, color: 'green', grid: true });
          const cs = ['gold', 'orange', 'pink', 'purple'], lab = ['u', 'Tu', 'T^2u', 'T^3u'];
          K.forEach((w, j) => { sc.arrow([0, 0, 0], w, { color: cs[j], alpha: j > m ? 0.35 : 1 }); if (j) sc.tex(lab[j], w, { color: cs[j], dx: 14, dy: -6, size: 14 }); });
          sc.flush();
          S.corner(`T${m === 1 ? '' : ['', '', '²', '³'][m]}u ∈ span of the earlier ones: deg q_u = ${m}`, 'tl', { color: 'green', weight: 700 });
          st = { qu, m, mp, divides };
          v.legend([['gold', '$u$'], ['orange', '$Tu$'], ['pink', '$T^2u$'], ['purple', '$T^3u$'], ['green', '$\\operatorname{span}(u, \\dots, T^{m-1}u)$', { area: true }]]);
        });
        v.readout(() => st && `$q_u(z) = ${polyT(st.qu, 'z', 3)}$ (degree $${st.m} \\le 3$) with $q_u(T)u = 0$. Minimal polynomial of $T$: $p(z) = ${factT(rootsOf(v.M, st.mp))}$, degree $${st.mp.length - 1} \\le \\dim V = 3$; ` + (st.divides ? '$q_u$ divides $p$ ✓.' : '$q_u \\nmid p$?!'));
      },
    },
    // ------------------------------------------------------------------ 5.24
    {
      num: '5.24',
      kind: 'Definition',
      name: 'Minimal polynomial',
      statement: String.raw`Suppose $V$ is finite-dimensional and $T \in \mathcal L(V)$. The **minimal polynomial** of $T$ is the unique monic polynomial $p \in \mathcal P(\mathbf F)$ of smallest degree such that $p(T) = 0$ (it exists and is unique by 5.22).`,
      idea: String.raw`To compute it, test the powers $I, T, T^2, \dots$ in turn: the first $T^m$ that is a linear combination $T^m = -(c_0I + c_1T + \dots + c_{m-1}T^{m-1})$ of the earlier powers gives $p(z) = z^m + c_{m-1}z^{m-1} + \dots + c_0$. Since $\mathcal L(V)$ has dimension $(\dim V)^2$ this must happen, and 5.22 says it happens by $m = \dim V$. Its degree measures how complicated $T$ is: $1$ for multiples of $I$, $\dim V$ for a single Jordan block.`,
      caption: String.raw`Pick an operator and slide "powers tested". Each tile is a power $T^k$ (blue entries positive, red negative). Under each tile is its distance from the span of the earlier tiles; the first tile at distance $0$ (green frame) ends the search, and the dependency is the minimal polynomial, shown factored in the readout. Compare the diagonal matrix (degree 2) with the Jordan block (degree 3) — both have only two or one distinct eigenvalues.`,
      deps: ['ladr-5.22'],
      tags: ['minimal polynomial'],
      viz(v) {
        const M = v.M;
        const PRE = { diag: [[1, 0, 0], [0, 2, 0], [0, 0, 2]], jordan: [[2, 1, 0], [0, 2, 1], [0, 0, 2]], rot: [[0, -1, 0], [1, 0, 0], [0, 0, 1]], proj: [[1, 0, 1], [0, 1, 1], [0, 0, 0]], nil: [[0, 1, 0], [0, 0, 1], [0, 0, 0]] };
        const which = v.select('$T$', [{ value: 'diag', label: 'diagonal' }, { value: 'jordan', label: 'Jordan block' }, { value: 'rot', label: 'rotation' }, { value: 'proj', label: 'projection' }, { value: 'nil', label: 'nilpotent' }], 'jordan');
        const K = v.slider('powers tested', 1, 3, 3, { int: true });
        const S = v.stage({ x: [-0.05, 4.45], y: [-0.62, 1.12], equal: true, axes: false, height: 290 });
        let st = null;
        v.render(() => {
          const A = PRE[which.value], mp = minPoly(M, A), m = mp.c.length - 1;
          const pw = [eye(3)]; for (let k = 1; k <= 3; k++) pw.push(mm(pw[k - 1], A));
          const labs = ['I', 'T', 'T^2', 'T^3'];
          pw.forEach((B, k) => {
            const x0 = 0.1 + k * 1.1, tested = k <= K.value, needed = k <= m;
            drawTile(S, B, x0, 0.12, 0.9, { frame: tested && k === m ? 'green' : 'muted', dim: !tested });
            S.tex(labs[k], x0 + 0.45, 0.02, { color: tested ? 'ink' : 'faint', baseline: 'top', size: 16 });
            if (k && tested) {
              const r = needed ? mp.res[k - 1] : 0, z = r < 1e-8;
              S.text(needed ? (z ? 'in the span ✓' : `distance ${nmc(r, 3)}`) : 'not needed', x0 + 0.45, -0.36, { color: needed ? (z ? 'green' : 'red') : 'faint', align: 'center', size: 13, weight: z ? 700 : 400 });
            }
          });
          st = { m, c: mp.c, A };
        });
        v.readout(() => {
          if (!st) return '';
          const { m, c, A } = st;
          if (m > K.value) return `$T = ${matT(A, 0)}$: $I, T, \\dots, T^{${K.value}}$ are linearly independent, so the minimal polynomial has degree $> ${K.value}$ — test more powers.`;
          return `$T = ${matT(A, 0)}$: $T^{${m}}$ is the first power in the span of the earlier ones, so the minimal polynomial is $p(z) = ${polyT(c)} = ${factT(rootsOf(v.M, c))}$, of degree $${m}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.27
    {
      num: '5.27',
      kind: 'Theorem',
      name: 'Eigenvalues are the zeros of the minimal polynomial',
      statement: String.raw`Suppose $V$ is finite-dimensional and $T \in \mathcal L(V)$. Then the zeros of the minimal polynomial of $T$ are exactly the eigenvalues of $T$.`,
      idea: String.raw`Let $p$ be the minimal polynomial. If $p(\lambda) = 0$, write $p(z) = (z - \lambda)q(z)$ (4.6) with $q$ monic of smaller degree; then $q(T) \ne 0$ by minimality, so $q(T)w \ne 0$ for some $w$, and $(T - \lambda I)\,q(T)w = p(T)w = 0$ shows that $\lambda$ is an eigenvalue. Conversely, if $Tv = \lambda v$ with $v \ne 0$, then $T^kv = \lambda^kv$, so $0 = p(T)v = p(\lambda)v$ and $p(\lambda) = 0$.`,
      caption: String.raw`Edit the matrix (drag or click entries, or pick a preset). The $\mathbf C$ panel shows the phase portrait of the minimal polynomial $p$ — its zeros are where all colours meet — with the zeros of $p$ ringed in green and the eigenvalues of $T$ as dots: they always coincide. The labels compare multiplicities: the minimal polynomial can have lower multiplicity than the characteristic polynomial (try the diagonal and scalar presets), but never misses an eigenvalue.`,
      deps: ['ladr-5.24', 'ladr-4.6', 'ladr-5.5'],
      tags: ['minimal polynomial', 'eigenvalues'],
      viz(v) {
        const M = v.M;
        const PRE = { jordan: [[1, 1, 0], [0, 1, 0], [0, 0, -1]], diag: [[1, 0, 0], [0, 1, 0], [0, 0, -1]], scalar: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], rot: [[0.5, -1, 0], [1, 0.5, 0], [0, 0, -1]] };
        let A = clone(PRE.jordan);
        v.select('preset', [{ value: 'jordan', label: 'Jordan' }, { value: 'diag', label: 'diagonal' }, { value: 'scalar', label: 'scalar' }, { value: 'rot', label: 'rotation block' }], 'jordan', { onChange: (k) => { A = clone(PRE[k]); } });
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, weight: 0.9, title: 'drag or click an entry' });
        const Z = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, height: 320, weight: 1.2, title: 'phase portrait of the minimal polynomial' });
        const draw = matEditor(E, () => A, { step: 0.5, lim: 3 });
        let st = null;
        v.render(() => {
          draw();
          const mp = minPoly(M, A).c, zp = rootsOf(M, mp);
          const ev = groupRoots(M.eig(A).values.map((z) => ({ re: z.re, im: z.im })));
          const R = Math.max(2.5, 1.35 * Math.max(...ev.map((g) => Math.hypot(g.re, g.im)), ...zp.map((g) => Math.hypot(g.re, g.im))));
          Z.setView([-R, R], [-R, R]);
          Z.domain((z) => cHorner(v, mp, z), { key: mp.map((t) => t.toFixed(6)).join() + R, fade: 0.55 });
          Z.axes();
          for (const g of zp) Z.circle(g.re, g.im, R * 0.055, { color: 'green', width: 3 });
          for (const g of ev) {
            Z.dot(g.re, g.im, { r: 5, color: 'ink' });
            const mz = zp.find((h) => Math.hypot(h.re - g.re, h.im - g.im) < 1e-2 * (1 + R));
            Z.tex(`${mz ? mz.m : 0} \\text{ in } p,\\ ${g.m} \\text{ in char}`, g.re, g.im, { dy: g.im < 0 ? 22 : -22, size: 12, color: 'ink' });
          }
          const match = zp.length === ev.length && zp.every((h) => ev.some((g) => Math.hypot(h.re - g.re, h.im - g.im) < 1e-2 * (1 + R)));
          st = { mp, zp, ev, match };
          v.legend([['green', 'zeros of the minimal polynomial', { dot: true }], ['ink', 'eigenvalues of $T$', { dot: true }]]);
        });
        v.readout(() => st && `Minimal polynomial $p(z) = ${factT(st.zp)}$ (degree $${st.mp.length - 1}$), characteristic polynomial $${factT(st.ev)}$. Zeros of $p$: $\\{${st.zp.map((g) => cxT(g.re, g.im)).join(',\\ ')}\\}$; eigenvalues: $\\{${st.ev.map((g) => cxT(g.re, g.im)).join(',\\ ')}\\}$ — ` + (st.match ? 'the same set ✓' : 'mismatch?!'));
      },
    },
    // ------------------------------------------------------------------ 5.29
    {
      num: '5.29',
      kind: 'Theorem',
      name: 'q(T) = 0 ⟺ q is a multiple of the minimal polynomial',
      statement: String.raw`Suppose $V$ is finite-dimensional, $T \in \mathcal L(V)$ and $q \in \mathcal P(\mathbf F)$. Then $q(T) = 0$ if and only if $q$ is a polynomial multiple of the minimal polynomial $p$ of $T$, that is, $q = sp$ for some $s \in \mathcal P(\mathbf F)$.`,
      idea: String.raw`If $q = sp$ then $q(T) = s(T)p(T) = 0$ by 5.17. Conversely, divide with remainder (4.9): $q = sp + r$ with $\deg r < \deg p$. Then $r(T) = q(T) - s(T)p(T) = q(T)$. If $q(T) = 0$, then $r(T) = 0$, and if $r$ were nonzero, dividing it by its leading coefficient would give a monic polynomial of degree less than $\deg p$ killing $T$ — contradicting minimality. So $r = 0$ and $p$ divides $q$.`,
      caption: String.raw`Drag the zeros of $q$ (gold, one per row; they snap to integers) and choose $\deg q$. Green lines mark the zeros of the minimal polynomial $p$ with their multiplicities. The tiles show $q(T)$ and $r(T)$, where $r$ is the remainder of $q$ divided by $p$: they are always the same matrix, and both become $0$ (green) exactly when each green zero is covered by enough gold ones. For the Jordan preset you need $1$ twice.`,
      deps: ['ladr-4.9', 'ladr-5.24', 'ladr-5.17'],
      tags: ['minimal polynomial'],
      viz(v) {
        const M = v.M;
        const PRE = { J: [[1, 1, 0], [0, 1, 0], [0, 0, -1]], D: [[1, 0, 0], [0, 1, 0], [0, 0, -1]], N: [[-1, 1, 0], [0, -1, 1], [0, 0, -1]] };
        const which = v.select('$T$', [{ value: 'J', label: '$p = (z-1)^2(z+1)$' }, { value: 'D', label: '$p = (z-1)(z+1)$' }, { value: 'N', label: '$p = (z+1)^3$' }], 'J');
        const deg = v.slider('$\\deg q$', 1, 4, 3, { int: true });
        const L = v.stage({ x: [-2.6, 2.6], y: [-0.75, 4.3], axes: false, height: 290, weight: 1.2, title: 'zeros of $q$ (gold) and of $p$ (green)' });
        const rowY = (k) => 3.6 - k;
        const H = [1, -1, 0.4, 2].map((x0, k) => L.handle(x0, rowY(k), { color: 'gold', label: `r${'₁₂₃₄'[k]}`, labelPos: 'n', constrain: (x) => { const n = Math.round(x); return [Math.abs(x - n) < 0.12 ? n : x, rowY(k)]; } }));
        const S = v.stage({ x: [-0.05, 2.25], y: [-0.25, 1.05], equal: true, axes: false, height: 290, weight: 1, title: '$q(T)$ and $r(T)$' });
        let st = null;
        v.render(() => {
          const A = PRE[which.value], p = minPoly(M, A).c, zp = rootsOf(M, p), d = deg.value;
          let q = [1]; for (let k = 0; k < d; k++) q = pmul(q, [-H[k].x, 1]);
          const { s, r } = pdiv(q, p), qT = polyMat(q, A), rT = polyMat(r, A), zero = fro(qT) < 1e-9;
          // number line and rows
          L.line(-2.5, -0.35, 2.5, -0.35, { color: 'muted', width: 1.2 });
          for (let t = -2; t <= 2; t++) { L.line(t, -0.43, t, -0.27, { color: 'muted' }); L.text(nmc(t, 0), t, -0.6, { color: 'muted', align: 'center', size: 12 }); }
          for (let k = 0; k < 4; k++) L.line(-2.5, rowY(k), 2.5, rowY(k), { color: 'grid', width: 1, alpha: k < d ? 1 : 0.4 });
          for (const g of zp) {
            L.line(g.re, -0.35, g.re, 3.95, { color: 'green', width: 3, alpha: 0.6 });
            const got = H.slice(0, d).filter((h) => Math.abs(h.x - g.re) < 1e-9).length;
            L.text(`need ${g.m}, have ${got}`, g.re, 4.1, { color: got >= g.m ? 'green' : 'red', align: 'center', size: 12, weight: 700 });
          }
          H.forEach((h, k) => { h.visible = k < d; });
          drawTile(S, qT, 0.05, 0.05, 0.9, { frame: zero ? 'green' : 'red' });
          drawTile(S, rT, 1.25, 0.05, 0.9, { frame: zero ? 'green' : 'red' });
          S.tex('q(T)', 0.5, -0.05, { baseline: 'top', size: 15 });
          S.tex('r(T)', 1.7, -0.05, { baseline: 'top', size: 15 });
          S.text('=', 1.1, 0.5, { size: 22, align: 'center', baseline: 'middle', color: 'muted' });
          st = { q, s, r, p, zero, zp };
          v.legend([['gold', 'zeros of $q$'], ['green', 'zeros of $p$']]);
        });
        v.readout(() => {
          if (!st) return '';
          const { q, s, r, p, zero } = st;
          return `$q(z) = ${polyT(q, 'z')} = \\bigl(${polyT(s, 'z')}\\bigr)\\,p(z) + \\bigl(${polyT(r, 'z')}\\bigr)$ with $p(z) = ${polyT(p)}$. ` + (zero ? 'Remainder $r = 0$ and $q(T) = 0$: $q$ is a multiple of $p$.' : `Remainder $r \\ne 0$ and $q(T) = r(T) \\ne 0$ (norm $${nm(fro(polyMat(r, PRE[which.value])), 3)}$).`);
        });
      },
    },
  ],
};
