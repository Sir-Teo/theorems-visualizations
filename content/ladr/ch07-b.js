// Sheldon Axler, Linear Algebra Done Right (4th ed.) — Chapter 7: Operators on Inner Product Spaces
// Part 2 (this file): items 7.23–7.55 — normal operators as A + iB, the real and complex spectral theorems,
// positive operators and their square roots, isometries and unitary operators.
// Part 1 is ch07.js (7.1–7.22); parts 3 and 4 are ch07-c.js and ch07-d.js.

// ---------- shared helpers ----------
const TAU = 2 * Math.PI;
const DEG = 180 / Math.PI;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/** A number for TeX: at most d decimals, trailing zeros dropped, never "-0". */
function tn(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  let s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
}
/** The same for canvas text (real minus sign). */
const pn = (x, d = 2) => tn(x, d).replace('-', '−');
const mtex = (A, d = 2) => `\\begin{bmatrix}${A.map((r) => r.map((x) => tn(x, d)).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`;
/** a + bi as TeX, for z = [re, im]. */
function ctn(z, d = 2) {
  const a = Number(tn(z[0], d)), b = Number(tn(z[1], d));
  if (b === 0) return tn(a, d);
  const bb = Math.abs(b) === 1 ? '' : tn(Math.abs(b), d);
  return a === 0 ? `${b < 0 ? '-' : ''}${bb}i` : `${tn(a, d)} ${b < 0 ? '-' : '+'} ${bb}i`;
}
const cmtex = (A, d = 2) => `\\begin{bmatrix}${A.map((r) => r.map((z) => ctn(z, d)).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`;
const mark = (ok) => (ok ? '✓' : '✗');

// real vectors and matrices (matrices are arrays of rows)
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const add = (a, b) => a.map((x, i) => x + b[i]);
const sub = (a, b) => a.map((x, i) => x - b[i]);
const scl = (a, k) => a.map((x) => x * k);
const len = (a) => Math.hypot(...a);
const unit = (a) => { const l = len(a); return l > 1e-12 ? scl(a, 1 / l) : a.map(() => 0); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const mv = (A, x) => A.map((r) => dot(r, x));
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
const tr = (A) => A[0].map((_, j) => A.map((r) => r[j]));
const eye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
const msub = (A, B) => A.map((r, i) => r.map((x, j) => x - B[i][j]));
const fro = (A) => Math.sqrt(A.flat().reduce((s, x) => s + x * x, 0));
const fromCols = (cs) => cs[0].map((_, i) => cs.map((c) => c[i]));
const ZERO3 = [0, 0, 0];
/** Orthonormal pair spanning the plane perpendicular to n. */
function perpPair(n) { const u = unit(n), a = unit(Math.abs(u[0]) < 0.9 ? cross(u, [1, 0, 0]) : cross(u, [0, 1, 0])); return [a, cross(u, a)]; }
/** Symmetric 2×2 matrix with eigenvalue l1 along (cos φ, sin φ) and l2 along the perpendicular direction. */
function symFrom(l1, l2, phi) {
  const c = Math.cos(phi), s = Math.sin(phi);
  return [[l1 * c * c + l2 * s * s, (l1 - l2) * c * s], [(l1 - l2) * c * s, l1 * s * s + l2 * c * c]];
}
/** Spectral data of a symmetric 2×2 matrix: eigenvalues l[0] ≥ l[1], angle phi of the first eigenvector, unit eigenvectors u. */
function esym2(A) {
  const a = A[0][0], b = (A[0][1] + A[1][0]) / 2, d = A[1][1], m = (a + d) / 2, r = Math.hypot((a - d) / 2, b);
  const phi = 0.5 * Math.atan2(2 * b, a - d), c = Math.cos(phi), s = Math.sin(phi);
  return { l: [m + r, m - r], phi, u: [[c, s], [-s, c]] };
}
/** Eigenvalues of a real 2×2 matrix: {real: true, l: [l1 ≥ l2]} or {real: false, re, im}. */
function eig2r(A) {
  const [[a, b], [c, d]] = A, t = (a + d) / 2, disc = t * t - (a * d - b * c);
  if (disc >= -1e-13) { const s = Math.sqrt(Math.max(0, disc)); return { real: true, l: [t + s, t - s] }; }
  return { real: false, re: t, im: Math.sqrt(-disc) };
}
/** Unit eigenvector of the real 2×2 matrix A for the real eigenvalue l (null when A = lI). */
function evec2(A, l) {
  const [[a, b], [c, d]] = A, x = [b, l - a], y = [l - d, c];
  const u = len(x) >= len(y) ? x : y, r = len(u);
  return r < 1e-9 ? null : [u[0] / r, u[1] / r];
}
/** Points of the image of the unit circle under the 2×2 matrix A. */
const imgCircle = (A, n = 140) => Array.from({ length: n + 1 }, (_, k) => mv(A, [Math.cos((TAU * k) / n), Math.sin((TAU * k) / n)]));
/** Singular values of a 2×2 matrix, with the unit vectors where they are attained. */
function sv2(A) { const e = esym2(mm(tr(A), A)); return { smax: Math.sqrt(Math.max(0, e.l[0])), smin: Math.sqrt(Math.max(0, e.l[1])), umax: e.u[0], umin: e.u[1] }; }
/** Dashed unit circle and the image ellipse of the unit circle under A. */
function drawEllipse(S, A, st = {}) {
  S.circle(0, 0, 1, { color: 'muted', dash: [4, 4], width: 1 });
  S.path(imgCircle(A), { close: true, fill: 'accent', fillAlpha: 0.08, color: 'accent', width: 1.7, ...st });
}
/** Angles θ ∈ [0, π) with A + B cos 2θ + C sin 2θ = 0 (all: null when it vanishes identically). */
function trigZeros(A, B, C) {
  const R = Math.hypot(B, C);
  if (R < 1e-12) return Math.abs(A) < 1e-12 ? null : [];
  const k = -A / R; if (Math.abs(k) > 1 + 1e-9) return [];
  const del = Math.atan2(C, B), ac = Math.acos(clamp(k, -1, 1)), md = (t) => ((t % Math.PI) + Math.PI) % Math.PI;
  return ac < 1e-7 || Math.PI - ac < 1e-7 ? [md((del + ac) / 2)] : [md((del + ac) / 2), md((del - ac) / 2)].sort((x, y) => x - y);
}

// complex scalars [re, im] and complex matrices (arrays of rows of complex scalars)
const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cconj = (a) => [a[0], -a[1]];
const cabs = (a) => Math.hypot(a[0], a[1]);
const cscale = (a, k) => [a[0] * k, a[1] * k];
const cexpi = (t) => [Math.cos(t), Math.sin(t)];
function csqrt(a) { const r = cabs(a), re = Math.sqrt(Math.max(0, (r + a[0]) / 2)); let im = Math.sqrt(Math.max(0, (r - a[0]) / 2)); if (a[1] < 0) im = -im; return [re, im]; }
const cmm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => cadd(s, cmul(a, B[k][j])), [0, 0])));
const cmv = (A, x) => A.map((r) => r.reduce((s, a, k) => cadd(s, cmul(a, x[k])), [0, 0]));
const cadj = (A) => A[0].map((_, j) => A.map((r) => cconj(r[j])));
const cmadd = (A, B) => A.map((r, i) => r.map((z, j) => cadd(z, B[i][j])));
const cmsub = (A, B) => A.map((r, i) => r.map((z, j) => csub(z, B[i][j])));
const cmscale = (A, w) => A.map((r) => r.map((z) => cmul(z, w)));
const cfro = (A) => Math.sqrt(A.flat().reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0));
const cnorm = (x) => Math.sqrt(x.reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0));
/** ⟨x, y⟩ = Σ x_k · conj(y_k). */
const cip = (x, y) => x.reduce((s, z, k) => cadd(s, cmul(z, cconj(y[k]))), [0, 0]);
const cI2 = [[[1, 0], [0, 0]], [[0, 0], [1, 0]]];
/** Eigenvalues and unit eigenvectors of a complex 2×2 matrix (an eigenvector is null when T is a scalar matrix). */
function ceig2(T) {
  const [[a, b], [c, d]] = T, h = cscale(cadd(a, d), 0.5), det = csub(cmul(a, d), cmul(b, c));
  const s = csqrt(csub(cmul(h, h), det)), l = [cadd(h, s), csub(h, s)];
  const vec = (lam) => { const x = [b, csub(lam, a)], y = [csub(lam, d), c], u = cnorm(x) >= cnorm(y) ? x : y, r = cnorm(u); return r < 1e-12 ? null : u.map((z) => cscale(z, 1 / r)); };
  return { l, u: l.map(vec), gap: 2 * cabs(s) };
}
/** The point of the unit sphere that represents the unit vector u ∈ C² up to a phase factor. */
function bloch(u) { const w = cmul(cconj(u[0]), u[1]); return [2 * w[0], 2 * w[1], cabs(u[0]) ** 2 - cabs(u[1]) ** 2]; }
/** Unitary 2×2 matrix whose first column is represented by the sphere point n (its second column by −n). */
function unitaryAt(n) {
  const th = Math.acos(clamp(n[2], -1, 1)), ph = Math.atan2(n[1], n[0]), c = Math.cos(th / 2), s = Math.sin(th / 2);
  const u = [[c, 0], cscale(cexpi(ph), s)], w = [cscale(cexpi(-ph), -s), [c, 0]];
  return [[u[0], w[0]], [u[1], w[1]]];
}
/** Great-circle arc between unit vectors p and q. */
function arc3(p, q, n = 28) {
  const om = Math.acos(clamp(dot(p, q), -1, 1)), so = Math.sin(om);
  if (om < 1e-6 || so < 1e-6) return [p, q];
  return Array.from({ length: n + 1 }, (_, k) => { const t = k / n; return add(scl(p, Math.sin((1 - t) * om) / so), scl(q, Math.sin(t * om) / so)); });
}
/** Unit sphere for a scene3: a faint disc (silhouette) and three great circles. */
function sphere(S, sc) {
  S.circle(0, 0, 1, { fill: 'accent', fillAlpha: 0.035, color: 'muted', width: 1, alpha: 0.5 });
  const ring = (f) => { const pts = []; for (let k = 0; k <= 64; k++) pts.push(f((TAU * k) / 64)); sc.path(pts, { color: 'muted', width: 0.8, alpha: 0.3 }); };
  ring((t) => [Math.cos(t), Math.sin(t), 0]);
  ring((t) => [Math.cos(t), 0, Math.sin(t)]);
  ring((t) => [0, Math.cos(t), Math.sin(t)]);
}
/** Editable matrix on a [0,1]² stage: drag an entry up/down, or click its upper/lower half; sym() mirrors edits. */
function matEditor(S, get, { step = 0.5, lim = 3, label = 'T', sym = () => false } = {}) {
  const box = () => { const n = get().length; return { n, x0: 0.17, y0: 0.05, cw: 0.78 / n, ch: 0.9 / n }; };
  const hit = (x, y) => { const b = box(), j = Math.floor((x - b.x0) / b.cw), i = Math.floor((b.y0 + b.n * b.ch - y) / b.ch); return i >= 0 && i < b.n && j >= 0 && j < b.n ? [i, j] : null; };
  const put = (i, j, val) => { const x = clamp(Math.round(val / step) * step, -lim, lim); get()[i][j] = x; if (sym()) get()[j][i] = x; };
  let drag = null, active = null;
  S.onDrag((x, y, ph) => {
    if (ph === 'start') { const c = hit(x, y); drag = c && { c, y0: y, a0: get()[c[0]][c[1]] }; active = c; }
    else if (ph === 'move' && drag) put(drag.c[0], drag.c[1], drag.a0 + Math.round((y - drag.y0) / (0.3 * box().ch)) * step);
    else if (ph === 'end') { drag = null; active = null; }
  });
  S.onClick((x, y) => { const c = hit(x, y); if (!c) return; const b = box(), yc = b.y0 + (b.n - c[0] - 0.5) * b.ch; put(c[0], c[1], get()[c[0]][c[1]] + (y > yc ? step : -step)); });
  return () => {
    const A = get(), b = box(), top = b.y0 + b.n * b.ch, x1 = b.x0 + b.n * b.cw;
    const px = Math.abs(S.X(b.cw) - S.X(0)), py = Math.abs(S.Y(0) - S.Y(b.ch)), size = Math.max(11, Math.min(19, px * 0.28, py * 0.4));
    const on = (i, j) => active && ((active[0] === i && active[1] === j) || (sym() && active[0] === j && active[1] === i));
    for (let i = 0; i < b.n; i++) for (let j = 0; j < b.n; j++) {
      const x = b.x0 + j * b.cw, y = top - (i + 1) * b.ch, hl = on(i, j);
      S.rect(x + 0.006, y + 0.01, x + b.cw - 0.006, y + b.ch - 0.01, { fill: hl ? 'gold' : 'accent', fillAlpha: hl ? 0.25 : 0.06, stroke: false });
      S.text(pn(A[i][j], 2), x + b.cw / 2, y + b.ch / 2, { size, align: 'center', baseline: 'middle' });
      S.text('▴', x + b.cw / 2, y + b.ch * 0.85, { size: 9, color: 'faint', align: 'center', baseline: 'middle' });
      S.text('▾', x + b.cw / 2, y + b.ch * 0.15, { size: 9, color: 'faint', align: 'center', baseline: 'middle' });
    }
    S.path([[b.x0 + 0.025, top], [b.x0 - 0.005, top], [b.x0 - 0.005, b.y0], [b.x0 + 0.025, b.y0]], { color: 'ink', width: 2 });
    S.path([[x1 - 0.025, top], [x1 + 0.005, top], [x1 + 0.005, b.y0], [x1 - 0.025, b.y0]], { color: 'ink', width: 2 });
    S.tex(`${label} =`, b.x0 - 0.03, (top + b.y0) / 2, { align: 'right', baseline: 'middle', size: 18 });
  };
}
/** A square matrix drawn as a tile of shaded cells (blue > 0, red < 0) with its entries. */
function drawTile(S, B, x0, y0, w, { frame = 'muted' } = {}) {
  const n = B.length, cw = w / n, mx = Math.max(1e-9, ...B.flat().map(Math.abs));
  const size = Math.max(8, Math.min(13.5, Math.abs(S.X(cw) - S.X(0)) * 0.26));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const b = Math.abs(B[i][j]) < 5e-3 ? 0 : B[i][j], x = x0 + j * cw, y = y0 + w - (i + 1) * cw;
    if (b) S.rect(x, y, x + cw, y + cw, { fill: b > 0 ? 'blue' : 'red', fillAlpha: 0.07 + (0.3 * Math.abs(b)) / mx, stroke: false });
    S.text(pn(b, 2), x + cw / 2, y + cw / 2, { size, align: 'center', baseline: 'middle', color: b ? 'ink' : 'faint' });
  }
  S.rect(x0, y0, x0 + w, y0 + w, { color: frame, width: frame === 'green' ? 2.6 : 1.2 });
}
/** Minimal polynomial (ascending monic coefficients): the first power Tᵏ that is a combination of I, T, …, Tᵏ⁻¹. */
function minPoly(M, A, tol = 1e-8) {
  const n = A.length, pw = [M.identity(n)];
  for (let k = 1; k <= n; k++) {
    pw.push(M.matMul(pw[k - 1], A));
    const B = M.transpose(pw.slice(0, k).map((X) => X.flat())), y = pw[k].flat(), c = M.lstsq(B, y);
    const r = y.map((t, i) => t - B[i].reduce((s, b, j) => s + b * c[j], 0));
    if (Math.hypot(...r) <= tol * Math.max(1, Math.hypot(...y))) return [...c.map((x) => -x), 1];
  }
  return M.charPoly(A);
}
/** Distinct zeros of a real polynomial (ascending coefficients) with multiplicities. */
function zerosMult(M, c) {
  const rs = M.polyRoots(c), out = [], sc = 1 + Math.max(0, ...rs.map((z) => z.abs()));
  for (const z of rs) {
    const g = out.find((o) => Math.hypot(o.sr / o.m - z.re, o.si / o.m - z.im) < 2e-3 * sc);
    if (g) { g.m++; g.sr += z.re; g.si += z.im; } else out.push({ sr: z.re, si: z.im, m: 1 });
  }
  return out.map((o) => ({ re: o.sr / o.m, im: Math.abs(o.si / o.m) < 1e-6 * sc ? 0 : o.si / o.m, m: o.m })).sort((a, b) => a.re - b.re || a.im - b.im);
}
/** Factored TeX over R from zerosMult output (conjugate pairs become irreducible quadratics). */
function factR(zs) {
  const s = zs.filter((z) => z.im >= 0).map(({ re, im, m }) => {
    let f;
    if (im === 0) f = Math.abs(re) < 5e-3 ? 'z' : `(z ${re > 0 ? '-' : '+'} ${tn(Math.abs(re))})`;
    else { const b = -2 * re, c = re * re + im * im; f = `(z^2 ${Math.abs(b) < 5e-3 ? '' : `${b < 0 ? '-' : '+'} ${tn(Math.abs(b))}z `}+ ${tn(c)})`; }
    return m > 1 ? `${f.startsWith('(') ? f : `(${f})`}^{${m}}` : f;
  }).join('');
  return s || '1';
}

export default {
  collection: 'ladr',
  chapter: 7,
  items: [
    // ------------------------------------------------------------------ 7.23
    {
      num: '7.23',
      kind: 'Theorem',
      name: 'Normal ⟺ real and imaginary parts commute',
      statement: String.raw`Suppose $\mathbf F = \mathbf C$ and $T \in \mathcal L(V)$. Then $T$ is normal if and only if there exist self-adjoint operators $A, B \in \mathcal L(V)$ that commute with each other ($AB = BA$) and satisfy $T = A + iB$.`,
      idea: String.raw`Copy $z = \operatorname{Re} z + i \operatorname{Im} z$, with the adjoint in the role of complex conjugation: $A = \tfrac12(T + T^*)$ and $B = \tfrac1{2i}(T - T^*)$ are self-adjoint and $T = A + iB$; they are the only such pair, because $T = A + iB$ forces $T^* = A - iB$. Multiplying out gives
$$AB - BA = \tfrac{1}{2i}\,(T^*T - TT^*),$$
so $A$ and $B$ commute exactly when $T$ commutes with $T^*$, which is the definition of normal (7.18).`,
      caption: String.raw`A self-adjoint $2\times2$ matrix is $a_0I + \begin{bmatrix} z & x - iy\\ x + iy & -z\end{bmatrix}$, so its trace-free part is a vector $(x, y, z) \in \mathbf R^3$, and for two of them $AB - BA$ is $2i$ times the matrix of the cross product. Drag $a$ (from $A$, blue) and $b$ (from $B$, orange). The red arrow is $a \times b$; $T = A + iB$ is normal exactly when it vanishes, that is when $b$ lies on the line through $a$ (it snaps there). Right: the dashed lines mark the eigenvalues of $A$ (vertical) and $B$ (horizontal). When $AB = BA$ the eigenvalues of $T$ sit on their crossings — $\lambda = \alpha + i\beta$ for a shared eigenvector — and otherwise they drift off.`,
      deps: ['ladr-7.18', 'ladr-7.10', 'ladr-5.71'],
      tags: ['normal'],
      viz(v) {
        const a0 = 0.3, b0 = -0.2;
        const herm = (h0, h) => [[[h0 + h[2], 0], [h[0], -h[1]]], [[h[0], h[1]], [h0 - h[2], 0]]];
        const PRE = { com: [[0.8, 0.25, 0.55], [-0.48, -0.15, -0.33]], non: [[0.8, 0.25, 0.55], [0.15, 0.85, -0.25]] };
        v.select('start from', [{ value: 'com', label: 'commuting parts' }, { value: 'non', label: 'non-commuting parts' }], 'com', { onChange: (k) => { ha.set(PRE[k][0]); hb.set(PRE[k][1]); } });
        const S = v.stage({ x: [-1.85, 1.85], y: [-1.7, 1.7], equal: true, axes: false, height: 380, weight: 1.15, title: 'trace-free parts of $A$, $B$ as vectors $a, b \\in \\mathbf R^3$' });
        const sc = v.scene3(S, { yaw: -0.62, pitch: 0.3, axis: 1.35, lim: 1.15 });
        const ha = sc.handle(PRE.com[0], { color: 'accent', label: 'a' });
        const hb = sc.handle(PRE.com[1], { color: 'orange', label: 'b', snap: (p) => { const u = unit(ha.p), c = dot(p, u); return len(sub(p, scl(u, c))) < 0.07 ? scl(u, c) : p; } });
        const Z = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, height: 380, title: 'eigenvalues of $T$ in $\\mathbf C$' });
        let st = null;
        v.render(() => {
          const a = ha.p, b = hb.p, c = cross(a, b), A = herm(a0, a), B = herm(b0, b);
          const T = cmadd(A, cmscale(B, [0, 1]));
          const comm = cfro(cmsub(cmm(A, B), cmm(B, A)));
          const nT = cfro(cmsub(cmm(cadj(T), T), cmm(T, cadj(T))));
          const ok = comm < 1e-9, ua = unit(a);
          sc.begin();
          sc.line(scl(ua, -1.7), scl(ua, 1.7), { color: ok ? 'green' : 'accent', width: ok ? 2.4 : 1.2, alpha: ok ? 0.7 : 0.35 }, 16);
          if (!ok) sc.poly([ZERO3, a, add(a, b), b], { fill: 'red', fillAlpha: 0.12, color: 'red', alpha: 0.4 });
          sc.arrow(ZERO3, a, { color: 'accent' });
          sc.arrow(ZERO3, b, { color: 'orange' });
          if (len(c) > 0.03) { sc.arrow(ZERO3, c, { color: 'red' }); sc.tex('a\\times b', c, { color: 'red', dx: 18, dy: -12, size: 14 }); }
          sc.flush();
          S.corner(ok ? 'a × b = 0: AB = BA, so T is normal' : 'a × b ≠ 0: AB ≠ BA, so T is not normal', 'tl', { color: ok ? 'green' : 'red', weight: 700 });
          const al = [a0 + len(a), a0 - len(a)], be = [b0 + len(b), b0 - len(b)], E = ceig2(T);
          const R = Math.max(2.3, 1.15 * Math.max(...al.map(Math.abs), ...be.map(Math.abs), ...E.l.map(cabs)));
          Z.setView([-R, R], [-R, R]);
          for (const x of al) Z.vline(x, { color: 'accent', dash: [5, 4], alpha: 0.75 });
          for (const y of be) Z.hline(y, { color: 'orange', dash: [5, 4], alpha: 0.75 });
          Z.tex('\\operatorname{spec} A', al[0], -0.9 * R, { color: 'accent', size: 13, dx: 4, align: 'left' });
          Z.tex('\\operatorname{spec} B', 0.9 * R, be[0], { color: 'orange', size: 13, dy: -12, align: 'right' });
          const onGrid = (z) => al.some((x) => be.some((y) => Math.hypot(z[0] - x, z[1] - y) < 1e-6));
          E.l.forEach((z, k) => { const g = onGrid(z); Z.dot(z[0], z[1], { r: 6, color: g ? 'green' : 'red', label: k ? 'λ₂' : 'λ₁', labelPos: z[0] >= (E.l[1 - k][0]) ? 'ne' : 'sw' }); });
          st = { T, comm, nT, ok, E };
        });
        v.legend([['accent', '$a$ (from $A$)'], ['orange', '$b$ (from $B$)'], ['red', '$a \\times b$, i.e. $\\tfrac{1}{2i}(AB - BA)$'], ['green', 'eigenvalue of $T$ on a crossing', { dot: true }]]);
        v.readout(() => st && `$T = A + iB = ${cmtex(st.T)},\\quad \\|AB - BA\\| = ${tn(st.comm, 3)},\\quad \\|T^*T - TT^*\\| = ${tn(st.nT, 3)}$` + (st.ok ? ` — the parts commute, so $T^*T = TT^*$ and $T$ is normal; its eigenvalues $${ctn(st.E.l[0])}$ and $${ctn(st.E.l[1])}$ are (eigenvalue of $A$) $+\\,i\\,$(eigenvalue of $B$).` : ` — always exactly $2\\|AB - BA\\|$, since $AB - BA = \\tfrac1{2i}(T^*T - TT^*)$: not normal.`));
      },
    },
    // ------------------------------------------------------------------ 7.26
    {
      num: '7.26',
      kind: 'Theorem',
      name: 'Invertible quadratic expressions',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ is self-adjoint and $b, c \in \mathbf R$ satisfy $b^2 < 4c$. Then
$$T^2 + bT + cI$$
is an invertible operator.`,
      idea: String.raw`For a real number $x$, completing the square gives $x^2 + bx + c = (x + \tfrac b2)^2 + (c - \tfrac{b^2}{4}) > 0$; the operator version runs the same way. For $v \ne 0$, self-adjointness turns $\langle T^2v, v\rangle$ into $\|Tv\|^2$, and Cauchy–Schwarz (6.14) bounds $|b\langle Tv, v\rangle| \le |b|\,\|Tv\|\,\|v\|$, so
$$\langle (T^2 + bT + cI)v, v\rangle \ge \big(\|Tv\| - \tfrac{|b|}{2}\|v\|\big)^2 + \big(c - \tfrac{b^2}{4}\big)\|v\|^2 > 0.$$
Hence $(T^2 + bT + cI)v \ne 0$: the operator is injective, and therefore invertible (3.65).`,
      caption: String.raw`Drag the gold point $(b, c)$. Shaded: the region $b^2 < 4c$ above the parabola. Red: the parameters for which $Q = T^2 + bT + cI$ is singular. For self-adjoint $T$ these are the tangent lines $c = -\lambda b - \lambda^2$ at the eigenvalues $\lambda$ (zeros of $z^2 + bz + c$), which never enter the shaded region. On the right, the unit circle is mapped by $Q$ to an ellipse that stays outside the green circle of radius $c - b^2/4$, the bound from the proof. For the operator that is not self-adjoint (eigenvalues $0.4 \pm 1.1i$), the singular parameter is a single point inside the shaded region; the handle snaps to it and the ellipse collapses to $0$.`,
      deps: ['ladr-6.14', 'ladr-3.65', 'ladr-7.10'],
      tags: ['self-adjoint'],
      viz(v) {
        const PRE = { s1: symFrom(1.3, -0.7, 0.5), s2: symFrom(1.1, 0.4, -0.4), rot: [[0.4, -1.1], [1.1, 0.4]] };
        const which = v.select('$T$', [{ value: 's1', label: 'self-adjoint, $\\lambda = 1.3,\\, -0.7$' }, { value: 's2', label: 'self-adjoint, $\\lambda = 1.1,\\, 0.4$' }, { value: 'rot', label: 'not self-adjoint' }], 's1');
        const P = v.stage({ x: [-3.2, 3.2], y: [-2.4, 3.4], height: 370, xlabel: 'b', ylabel: 'c', title: 'parameters $(b, c)$' });
        const S = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, height: 370, title: 'the unit circle under $Q = T^2 + bT + cI$' });
        const sing = () => { const e = eig2r(PRE[which.value]); return e.real ? { lines: e.l, pts: [] } : { lines: [], pts: [[-2 * e.re, e.re * e.re + e.im * e.im]] }; };
        const h = P.handle(0.6, 1.5, {
          color: 'gold', label: '(b, c)', constrain: (x, y) => {
            const s = sing();
            for (const [px, py] of s.pts) if (Math.hypot((x - px) / 6.4, (y - py) / 5.8) < 0.02) return [px, py];
            for (const l of s.lines) { const yl = -l * x - l * l; if (Math.abs(y - yl) < 0.07) return [x, yl]; }
            return [x, y];
          },
        });
        let st = null;
        v.render(() => {
          const T = PRE[which.value], b = h.x, c = h.y, inside = b * b < 4 * c, s = sing();
          P.between(() => 3.6, (x) => (x * x) / 4, -3.3, 3.3, { fill: 'green', fillAlpha: 0.1 });
          P.fn((x) => (x * x) / 4, { color: 'green', width: 2 });
          P.tex('b^2 < 4c', -1.9, 2.9, { color: 'green', size: 15 });
          for (const l of s.lines) { P.fn((x) => -l * x - l * l, { color: 'red', width: 2 }); P.dot(-2 * l, l * l, { r: 3.5, color: 'red' }); }
          for (const [px, py] of s.pts) P.dot(px, py, { r: 6, color: 'red', label: 'singular here', labelPos: 'w' });
          const T2 = mm(T, T), Q = [[T2[0][0] + b * T[0][0] + c, T2[0][1] + b * T[0][1]], [T2[1][0] + b * T[1][0], T2[1][1] + b * T[1][1] + c]];
          const sv = sv2(Q), singular = sv.smin < 1e-9, lb = c - (b * b) / 4;
          const R = Math.max(2.2, 1.12 * sv.smax); S.setView([-R, R], [-R, R]);
          S.circle(0, 0, 1, { color: 'muted', dash: [4, 4], width: 1 });
          if (inside) S.circle(0, 0, lb, { color: 'green', dash: [6, 4], width: 1.6, fill: 'green', fillAlpha: 0.07 });
          const pts = imgCircle(Q);
          if (singular) { S.path(pts, { color: 'red', width: 4 }); S.dot(0, 0, { r: 5, color: 'red' }); }
          else S.path(pts, { close: true, fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 2 });
          const q = mv(Q, sv.umin);
          if (!singular) { S.line(0, 0, q[0], q[1], { color: 'orange', width: 2.4 }); S.dot(q[0], q[1], { r: 4, color: 'orange' }); }
          S.corner(singular ? 'Q is singular' : 'Q is invertible', 'tl', { color: singular ? 'red' : 'accent', weight: 700 });
          st = { Q, b, c, inside, smin: sv.smin, lb, singular, sa: which.value !== 'rot' };
        });
        v.legend([['green', 'region $b^2 < 4c$ / bound $c - b^2/4$'], ['red', '$Q$ singular'], ['accent', '$Q$(unit circle)'], ['orange', 'shortest $Qv$, $\\|v\\| = 1$']]);
        v.readout(() => {
          if (!st) return '';
          const head = `$Q = ${mtex(st.Q)},\\quad b^2 - 4c = ${tn(st.b * st.b - 4 * st.c)},\\quad \\min_{\\|v\\| = 1} \\|Qv\\| = ${tn(st.smin, 3)}$`;
          if (!st.inside) return head + (st.singular ? ' — outside the region $b^2 < 4c$ the quadratic has the real zero $\\lambda$, and $Q$ kills an eigenvector.' : ' — outside the region $b^2 < 4c$ the theorem promises nothing; $Q$ happens to be invertible here.');
          if (st.sa) return head + ` $\\ge c - \\tfrac{b^2}{4} = ${tn(st.lb, 3)} > 0$, so $Q$ is invertible, as the theorem says.`;
          return head + (st.singular ? ` — here $z^2 + bz + c$ is the characteristic polynomial of $T$, so $Q = 0$: invertibility fails because $T$ is not self-adjoint.` : st.smin < st.lb - 1e-9 ? ` $< c - \\tfrac{b^2}{4} = ${tn(st.lb, 3)}$: the bound from the proof fails, because $T$ is not self-adjoint.` : ` (bound $c - \\tfrac{b^2}{4} = ${tn(st.lb, 3)}$; move toward the red point).`);
        });
      },
    },
    // ------------------------------------------------------------------ 7.27
    {
      num: '7.27',
      kind: 'Theorem',
      name: 'Minimal polynomial of a self-adjoint operator',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ is self-adjoint. Then the minimal polynomial of $T$ equals $(z - \lambda_1)\cdots(z - \lambda_m)$ for some real numbers $\lambda_1, \dots, \lambda_m$.`,
      idea: String.raw`Over $\mathbf C$: the zeros of the minimal polynomial are the eigenvalues of $T$ (5.27), which are real (7.12), so the fundamental theorem of algebra (4.13) gives a product of real linear factors. Over $\mathbf R$: factor the minimal polynomial into real linear factors and irreducible quadratics $z^2 + bz + c$ with $b^2 < 4c$ (4.16). If a quadratic factor occurred, $T^2 + bT + cI$ would be invertible by 7.26, and cancelling it from the identity $p(T) = 0$ would leave a polynomial of smaller degree that still kills $T$, which is impossible. (The spectral theorem will show moreover that the $\lambda_k$ are distinct.)`,
      caption: String.raw`Edit the $3\times3$ matrix: drag an entry up or down, or click the upper or lower half of a cell, in steps of $\tfrac12$; in the symmetric examples every edit is mirrored across the diagonal, so the matrix stays self-adjoint. Right: the zeros of the minimal polynomial (dots), computed from the first linear dependence among $I, T, T^2, T^3$, and the eigenvalues with algebraic multiplicity (rings). For a symmetric matrix the dots always land on the real axis. Switch to a non-symmetric example to see an irreducible factor $z^2 + bz + c$ appear as a conjugate pair (red) or a repeated factor $(z - \lambda)^2$ (orange).`,
      deps: ['ladr-5.27', 'ladr-7.12', 'ladr-4.13', 'ladr-4.16', 'ladr-7.26'],
      tags: ['self-adjoint', 'minimal polynomial'],
      viz(v) {
        const M = v.M;
        const EX = {
          sym: [[2, 1, 0], [1, 0.5, -1], [0, -1, -1]],
          symrep: [[1, 1, 0], [1, 1, 0], [0, 0, 2]],
          any: [[0.5, -2, 0], [1.5, 0.5, 0], [0.5, 1, -1]],
          anyrep: [[2, 1, 0], [0, 2, 0], [0.5, 0, -1]],
        };
        let A = EX.sym.map((r) => r.slice());
        const ex = v.select('example', [{ value: 'sym', label: 'symmetric' }, { value: 'symrep', label: 'symmetric, repeated $\\lambda$' }, { value: 'any', label: 'not symmetric' }, { value: 'anyrep', label: 'not symmetric, repeated $\\lambda$' }], 'sym', { onChange: (k) => { A = EX[k].map((r) => r.slice()); } });
        const symMode = () => ex.value.startsWith('sym');
        v.button('random matrix', () => {
          const r = () => Math.round((Math.random() * 4 - 2) * 2) / 2;
          A = [[r(), r(), r()], [r(), r(), r()], [r(), r(), r()]];
          if (symMode()) for (let i = 0; i < 3; i++) for (let j = 0; j < i; j++) A[i][j] = A[j][i];
        });
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 0.85, title: 'drag or click the entries' });
        const draw = matEditor(E, () => A, { sym: symMode });
        const Z = v.stage({ x: [-3.5, 3.5], y: [-2.6, 2.6], equal: true, height: 330, weight: 1.15, title: 'zeros of the minimal polynomial in $\\mathbf C$' });
        let st = null;
        v.render(() => {
          draw();
          const mp = minPoly(M, A), zs = zerosMult(M, mp), cp = M.charPoly(A), ev = zerosMult(M, cp);
          const R = Math.max(3, 1.3 * Math.max(...ev.map((z) => Math.hypot(z.re, z.im))));
          Z.setView([-R, R], [-0.75 * R, 0.75 * R]);
          Z.hline(0, { color: 'green', width: 3, alpha: 0.35 });
          Z.text('real axis', R * 0.97, 0, { align: 'right', dy: -12, color: 'green', size: 12 });
          for (const z of ev) { Z.dot(z.re, z.im, { r: 11, hollow: true, color: 'muted', width: 1.4 }); if (z.m > 1) Z.text(`λ ×${z.m}`, z.re, z.im, { dy: 22, align: 'center', color: 'muted', size: 11.5 }); }
          let quad = null;
          for (const z of zs) {
            const col = z.im !== 0 ? 'red' : z.m > 1 ? 'orange' : 'accent';
            Z.dot(z.re, z.im, { r: 6, color: col, label: z.im === 0 ? (z.m > 1 ? `${pn(z.re)}  (twice)` : pn(z.re)) : null, labelPos: 'n' });
            if (z.im > 0) {
              Z.line(z.re, z.im, z.re, -z.im, { color: 'red', dash: [4, 4], width: 1.3 });
              const b = -2 * z.re, c = z.re * z.re + z.im * z.im;
              quad = { b, c };
              Z.tex(`z^2 ${b < 0 ? '-' : '+'} ${tn(Math.abs(b))}z + ${tn(c)}`, z.re, z.im, { color: 'red', dx: 12, dy: -14, align: 'left', size: 14 });
            }
          }
          const allReal = zs.every((z) => z.im === 0);
          Z.corner(allReal ? 'all zeros real: product of real linear factors' : 'an irreducible quadratic factor', 'tl', { color: allReal ? 'green' : 'red', weight: 700 });
          let qd = null;
          if (quad) { const A2 = M.matMul(A, A); qd = M.det(A2.map((r, i) => r.map((x, j) => x + quad.b * A[i][j] + (i === j ? quad.c : 0)))); }
          const sym = A.every((r, i) => r.every((x, j) => x === A[j][i]));
          st = { mp, zs, ev, quad, qd, sym, deg: mp.length - 1 };
        });
        v.legend([['accent', 'simple real zero', { dot: true }], ['orange', 'repeated real zero', { dot: true }], ['red', 'conjugate pair', { dot: true }], ['muted', 'eigenvalues (with multiplicity)', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          let s = `${st.sym ? 'Symmetric' : 'Not symmetric'}: minimal polynomial $${factR(st.zs)}$ of degree ${st.deg}; characteristic polynomial $${factR(st.ev)}$.`;
          if (st.quad) s += ` The factor $z^2 + bz + c$ has $b^2 - 4c = ${tn(st.quad.b ** 2 - 4 * st.quad.c)} < 0$, yet $\\det(T^2 + bT + cI) = ${tn(st.qd, 3)}$: singular, which 7.26 rules out for self-adjoint $T$.`;
          else if (st.sym) s += ' Only real linear factors, as the theorem says.';
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 7.29
    {
      num: '7.29',
      kind: 'Theorem',
      name: 'Real spectral theorem',
      statement: String.raw`Suppose $\mathbf F = \mathbf R$ and $T \in \mathcal L(V)$. Then the following are equivalent:
(a) $T$ is self-adjoint;
(b) $T$ has a diagonal matrix with respect to some orthonormal basis of $V$;
(c) $V$ has an orthonormal basis consisting of eigenvectors of $T$.`,
      idea: String.raw`(a)⇒(b): by 7.27 the minimal polynomial of $T$ is a product of real linear factors, so by 6.37 $T$ has an upper-triangular matrix with respect to some orthonormal basis. In that basis the matrix of $T^* = T$ is the transpose (7.9), and an upper-triangular matrix equal to its transpose is diagonal. (b)⇒(a): a diagonal matrix equals its transpose, so $T^* = T$. (b)⟺(c) is what a diagonal matrix means (5.55).`,
      caption: String.raw`Drag $Te_1$ (teal) and $Te_2$ (pink) to edit $T$; in symmetric mode $Te_2$ slides on the dashed guide, which keeps the matrix symmetric. Drag the gold handle $f_1$ to rotate an orthonormal basis $f_1, f_2$ (the dashed arrows are $Tf_1, Tf_2$). The right panel plots the two off-diagonal entries of $\mathcal M(T, (f_1, f_2))$ against the angle of $f_1$. For symmetric $T$ the curves coincide and vanish together; there (the handle snaps) the matrix is diagonal and $f_1, f_2$ lie along the axes of the ellipse $T(\text{unit circle})$. Without symmetry the curves differ by the constant $b - c$, so they never vanish at the same time: the best an orthonormal basis can do is triangular (6.37).`,
      deps: ['ladr-6.37', 'ladr-7.27', 'ladr-7.9', 'ladr-5.55'],
      see: ['fa-12.30'],
      tags: ['spectral theorem'],
      viz(v) {
        const snap = (x) => Math.round(x * 10) / 10;
        const mode = v.select('$T$', [{ value: 'sym', label: 'symmetric' }, { value: 'any', label: 'not symmetric' }], 'sym', { onChange: (m) => { if (m === 'any') { h1.set(1.3, 0.2); h2.set(0.9, 0.7); } else { h1.set(1.3, 0.6); h2.set(0.6, 0.4); } } });
        const S = v.stage({ x: [-2.3, 2.3], y: [-2, 2], equal: true, height: 380, weight: 1.1 });
        const G = v.stage({ x: [0, 180], y: [-1.6, 1.6], height: 380, xlabel: 'angle θ of f₁ (degrees)', xticks: [0, 45, 90, 135, 180], title: 'off-diagonal entries of $\\mathcal M\\big(T, (f_1, f_2)\\big)$' });
        const h1 = S.handle(1.3, 0.6, { color: 'teal', label: 'Te₁', constrain: (x, y) => [snap(x), snap(y)] });
        const h2 = S.handle(0.6, 0.4, { color: 'pink', label: 'Te₂', constrain: (x, y) => [mode.value === 'sym' ? h1.y : snap(x), snap(y)] });
        const Tm = () => [[h1.x, h2.x], [h1.y, h2.y]];
        // m21(θ) = (c−b)/2 + (c+b)/2 cos2θ + (d−a)/2 sin2θ,  m12(θ) = (b−c)/2 + (b+c)/2 cos2θ + (d−a)/2 sin2θ
        const z21 = (T) => trigZeros((T[1][0] - T[0][1]) / 2, (T[1][0] + T[0][1]) / 2, (T[1][1] - T[0][0]) / 2) || [];
        const z12 = (T) => trigZeros((T[0][1] - T[1][0]) / 2, (T[1][0] + T[0][1]) / 2, (T[1][1] - T[0][0]) / 2) || [];
        const hf = S.handle(Math.cos(0.3), Math.sin(0.3), {
          color: 'gold', label: 'f₁', constrain: (x, y) => {
            let t = Math.atan2(y, x);
            for (const z of z21(Tm())) for (const k of [-2, -1, 0, 1]) if (Math.abs(t - (z + k * Math.PI)) < 3 / DEG) t = z + k * Math.PI;
            return [Math.cos(t), Math.sin(t)];
          },
        });
        let st = null;
        v.render(() => {
          const sym = mode.value === 'sym';
          if (sym) h2.x = h1.y;
          const T = Tm(), [[a, b], [c, d]] = T;
          const th = Math.atan2(hf.y, hf.x), f1 = [Math.cos(th), Math.sin(th)], f2 = [-f1[1], f1[0]];
          const Tf1 = mv(T, f1), Tf2 = mv(T, f2);
          const M11 = dot(Tf1, f1), M12 = dot(Tf2, f1), M21 = dot(Tf1, f2), M22 = dot(Tf2, f2);
          const diag = Math.abs(M12) < 1e-9 && Math.abs(M21) < 1e-9, tri = Math.abs(M21) < 1e-9;
          if (sym) S.vline(h1.y, { color: 'pink', dash: [3, 4], alpha: 0.45 });
          drawEllipse(S, T);
          if (diag) for (const f of [f1, f2]) S.line(-2.8 * f[0], -2.8 * f[1], 2.8 * f[0], 2.8 * f[1], { color: 'green', width: 1.5, alpha: 0.6 });
          S.arrow(0, 0, a, c, { color: 'teal', width: 1.5, alpha: 0.55 });
          S.arrow(0, 0, b, d, { color: 'pink', width: 1.5, alpha: 0.55 });
          S.arrow(0, 0, Tf1[0], Tf1[1], { color: 'gold', width: 2, dash: [5, 3] });
          S.arrow(0, 0, Tf2[0], Tf2[1], { color: 'purple', width: 2, dash: [5, 3] });
          S.arrow(0, 0, f1[0], f1[1], { color: 'gold', width: 2.6 });
          S.arrow(0, 0, f2[0], f2[1], { color: 'purple', width: 2.6 });
          S.tex('f_2', f2[0], f2[1], { color: 'purple', dx: -12, dy: -10 });
          if (len(Tf1) > 0.25) S.tex('Tf_1', Tf1[0], Tf1[1], { color: 'gold', dx: 16, dy: 10, size: 14 });
          if (len(Tf2) > 0.25) S.tex('Tf_2', Tf2[0], Tf2[1], { color: 'purple', dx: -16, dy: 10, size: 14 });
          S.corner(diag ? 'diagonal: f₁, f₂ are orthonormal eigenvectors' : tri ? 'upper-triangular, not diagonal' : 'matrix not diagonal', 'tl', { color: diag ? 'green' : tri ? 'orange' : 'muted', weight: 700 });
          const off = Math.abs(b - c) / 2, Rr = Math.hypot((b + c) / 2, (d - a) / 2), ymax = Math.max(1.1, 1.18 * (off + Rr));
          G.setView([0, 180], [-ymax, ymax]);
          const m21 = (t) => { const r = t / DEG; return (c - b) / 2 + ((c + b) / 2) * Math.cos(2 * r) + ((d - a) / 2) * Math.sin(2 * r); };
          const m12 = (t) => m21(t) + (b - c);
          G.fn(m21, { color: 'orange', width: 2.6 });
          G.fn(m12, { color: 'purple', width: 2.2, dash: [7, 5] });
          if (sym) for (const z of z21(T)) G.dot(z * DEG, 0, { r: 6, color: 'green' });
          else {
            for (const z of z21(T)) G.dot(z * DEG, 0, { r: 5, color: 'orange', hollow: true });
            for (const z of z12(T)) G.dot(z * DEG, 0, { r: 5, color: 'purple', hollow: true });
            G.corner(`m₁₂ − m₂₁ = b − c = ${pn(b - c)} at every θ`, 'tr', { color: 'purple', weight: 700 });
          }
          const thd = (((th * DEG) % 180) + 180) % 180;
          G.vline(thd, { color: 'gold', width: 1.5 });
          G.dot(thd, M21, { r: 4.5, color: 'orange' }); G.dot(thd, M12, { r: 4.5, color: 'purple' });
          st = { M: [[M11, M12], [M21, M22]], thd, diag, tri, sym, bc: b - c };
        });
        v.legend([['gold', '$f_1$, $Tf_1$'], ['purple', '$f_2$, $Tf_2$'], ['orange', '$m_{21} = \\langle Tf_1, f_2\\rangle$'], ['purple', '$m_{12} = \\langle Tf_2, f_1\\rangle$', { dash: true }], ['green', 'diagonal: principal axes']]);
        v.readout(() => {
          if (!st) return '';
          const head = `$\\theta = ${tn(st.thd, 1)}^\\circ,\\quad \\mathcal M\\big(T, (f_1, f_2)\\big) = ${mtex(st.M)}$`;
          if (st.diag) return head + ` — diagonal: $f_1, f_2$ is an orthonormal basis of eigenvectors, with eigenvalues $${tn(st.M[0][0])}$ and $${tn(st.M[1][1])}$.`;
          if (st.sym) return head + ' — rotate $f_1$ to a zero of the curves (it snaps) to diagonalize.';
          return head + ` — $T \\ne T^*$, and $m_{12} - m_{21} = ${tn(st.bc)} \\ne 0$ in every orthonormal basis, so none of them diagonalizes $T$${st.tri ? '; this one triangularizes it' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.31
    {
      num: '7.31',
      kind: 'Theorem',
      name: 'Complex spectral theorem',
      statement: String.raw`Suppose $\mathbf F = \mathbf C$ and $T \in \mathcal L(V)$. Then the following are equivalent:
(a) $T$ is normal;
(b) $T$ has a diagonal matrix with respect to some orthonormal basis of $V$;
(c) $V$ has an orthonormal basis consisting of eigenvectors of $T$.`,
      idea: String.raw`(a)⇒(b): Schur's theorem (6.38) gives an orthonormal basis $e_1, \dots, e_n$ in which $\mathcal M(T) = (a_{j,k})$ is upper triangular. Then $\|Te_1\|^2 = |a_{1,1}|^2$, while $\|T^*e_1\|^2 = |a_{1,1}|^2 + \dots + |a_{1,n}|^2$. Normality makes these equal (7.20), so the rest of the first row vanishes; repeating the argument row by row kills the whole strict upper triangle. (b)⇒(a): in that basis $\mathcal M(T^*)$ is the conjugate transpose (7.9), also diagonal, and diagonal matrices commute. (b)⟺(c) as in 5.55.`,
      caption: String.raw`Every complex $2\times2$ matrix can be written $T = U\begin{bmatrix}\lambda_1 & t\\ 0 & \lambda_2\end{bmatrix}U^*$ with $U$ unitary (Schur). Drag $\lambda_1, \lambda_2$ and the corner $t$ (red) on the right, and the first Schur vector $e_1$ on the sphere. The sphere shows the unit vectors of $\mathbf C^2$ up to a phase factor: $(\cos\frac\vartheta2,\ e^{i\varphi}\sin\frac\vartheta2)$ sits at polar angle $\vartheta$ and longitude $\varphi$, and $|\langle u, w\rangle|^2 = \frac12(1 + \cos\angle(u, w))$, so orthogonal vectors are antipodal. The blue and orange points are the computed eigenvectors $u_1, u_2$ of $T$. They are antipodal — an orthonormal eigenbasis — exactly when $t = 0$ (it snaps there), which is exactly when $T$ is normal.`,
      deps: ['ladr-6.38', 'ladr-7.20', 'ladr-7.9', 'ladr-5.55'],
      see: ['fa-12.23', 'fa-12.30'],
      tags: ['spectral theorem'],
      viz(v) {
        const S = v.stage({ x: [-1.5, 1.5], y: [-1.4, 1.4], equal: true, axes: false, height: 380, weight: 1.1, title: 'eigenvectors of $T$ as points of the sphere of directions in $\\mathbf C^2$' });
        const sc = v.scene3(S, { yaw: -0.55, pitch: 0.32, axes: false, lim: 1.3 });
        const he = sc.handle(unit([0.45, -0.55, 0.7]), { color: 'accent', label: 'e₁', snap: (p) => (len(p) > 1e-3 ? unit(p) : [0, 0, 1]) });
        const Z = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 380, title: '$\\lambda_1, \\lambda_2$ and the Schur corner $t$ in $\\mathbf C$' });
        const l1 = Z.handle(1.2, 0.7, { color: 'accent', label: 'λ₁' });
        const l2 = Z.handle(-0.9, -0.5, { color: 'orange', label: 'λ₂' });
        const ht = Z.handle(0.8, -1.2, { color: 'red', label: 't', constrain: (x, y) => (Math.hypot(x, y) < 0.13 ? [0, 0] : [x, y]) });
        v.button('random $T$', () => {
          const r = () => [Math.random() * 1.6 - 0.8, Math.random() * 1.6 - 0.8];
          const T = [[r(), r()], [r(), r()]], E = ceig2(T), u1 = E.u[0] || [[1, 0], [0, 0]];
          const n = bloch(u1), U = unitaryAt(n), Sch = cmm(cmm(cadj(U), T), U);
          he.set(n); l1.set(Sch[0][0][0], Sch[0][0][1]); l2.set(Sch[1][1][0], Sch[1][1][1]); ht.set(Sch[0][1][0], Sch[0][1][1]);
        });
        v.button('set $t = 0$', () => ht.set(0, 0));
        let st = null;
        v.render(() => {
          const U = unitaryAt(he.p), lam1 = [l1.x, l1.y], lam2 = [l2.x, l2.y], t = [ht.x, ht.y];
          const T = cmm(cmm(U, [[lam1, t], [[0, 0], lam2]]), cadj(U)), E = ceig2(T);
          const k1 = cabs(csub(E.l[0], lam1)) <= cabs(csub(E.l[1], lam1)) ? 0 : 1, w1 = E.u[k1], w2 = E.u[1 - k1];
          const defect = cfro(cmsub(cmm(cadj(T), T), cmm(T, cadj(T)))), normal = defect < 1e-9, scalar = !w1 && !w2;
          const single = !scalar && E.gap < 1e-9;
          const n1 = w1 ? bloch(w1) : he.p, n2 = w2 ? bloch(w2) : null, anti = scl(n1, -1);
          sc.begin();
          sphere(S, sc);
          sc.dot(anti, { r: 5.5, hollow: true, color: 'muted' });
          sc.tex('e_2', anti, { color: 'muted', dx: 14, dy: 12, size: 14 });
          if (n2 && !single) {
            const ok = len(add(n1, n2)) < 1e-6;
            sc.line(n1, n2, { color: ok ? 'green' : 'red', width: 2.2, alpha: 0.85 }, 12);
            if (!ok) sc.path(arc3(n2, anti), { color: 'red', width: 3, alpha: 0.7 });
            sc.dot(n2, { r: 6.5, color: 'orange' });
            sc.tex('u_2', n2, { color: 'orange', dx: 14, dy: -12, size: 15 });
          }
          sc.dot(n1, { r: 4, color: 'accent' });
          sc.tex('u_1', n1, { color: 'accent', dx: -16, dy: 14, size: 15 });
          sc.flush();
          S.corner(scalar ? 'T = λI: every vector is an eigenvector' : single ? 'one eigen-direction only: no eigenbasis' : normal ? 'antipodal: u₁ ⊥ u₂, orthonormal eigenbasis' : 'not antipodal: u₁, u₂ not orthogonal', 'tl', { color: normal ? 'green' : 'red', weight: 700 });
          Z.line(0, 0, t[0], t[1], { color: 'red', dash: [5, 4], width: 1.5 });
          for (const z of E.l) Z.dot(z[0], z[1], { r: 12, hollow: true, color: 'green', width: 1.6 });
          Z.corner(normal ? 't = 0: Schur form diagonal' : `|t| = ${pn(cabs(t))}`, 'tl', { color: normal ? 'green' : 'red', weight: 700 });
          st = { T, defect, normal, ip: w1 && w2 ? cabs(cip(w1, w2)) : null, a1: cabs(lam1) ** 2, t2: cabs(t) ** 2 };
        });
        v.legend([['accent', '$u_1$ (eigenvalue $\\lambda_1$)', { dot: true }], ['orange', '$u_2$ (eigenvalue $\\lambda_2$)', { dot: true }], ['green', 'computed eigenvalues of $T$', { dot: true }], ['red', 'corner $t$, gap from antipodal']]);
        v.readout(() => st && `$T = ${cmtex(st.T)},\\quad \\|T^*T - TT^*\\| = ${tn(st.defect, 3)}$` + (st.ip !== null ? `$,\\quad |\\langle u_1, u_2\\rangle| = ${tn(st.ip, 3)}$` : '') + `. In the Schur basis: $\\|Te_1\\|^2 = |\\lambda_1|^2 = ${tn(st.a1, 3)}$ but $\\|T^*e_1\\|^2 = |\\lambda_1|^2 + |t|^2 = ${tn(st.a1 + st.t2, 3)}$` + (st.normal ? ' — equal, so the corner is $0$ and the Schur form is already diagonal.' : ' — unequal, so $T$ is not normal (7.20).'));
      },
    },
    // ------------------------------------------------------------------ 7.34
    {
      num: '7.34',
      kind: 'Definition',
      name: 'Positive operator',
      statement: String.raw`An operator $T \in \mathcal L(V)$ is called **positive** if $T$ is self-adjoint and
$$\langle Tv, v\rangle \ge 0 \quad\text{for all } v \in V.$$
When $V$ is a complex vector space, the requirement that $T$ be self-adjoint can be dropped: it follows from the inequality, by 7.14.`,
      idea: String.raw`Positive operators play the role of the nonnegative real numbers among all operators. The function $v \mapsto \langle Tv, v\rangle$ is a quadratic form, and positivity says that its graph never dips below $0$. Examples: orthogonal projections, $T^2 + bT + cI$ for self-adjoint $T$ with $b^2 < 4c$ (the proof of 7.26), and every operator of the form $R^*R$. Many authors say *positive semidefinite*; the strict version, $\langle Tv, v\rangle > 0$ for all $v \ne 0$, means positive and invertible.`,
      caption: String.raw`Choose the eigenvalues $\lambda_1, \lambda_2$ and the axis angle of a symmetric $2\times2$ matrix, or pick a preset. Left: the graph of $q(v) = \langle Tv, v\rangle$ over the unit disc (drag it to rotate), green where $q \ge 0$ and red where $q < 0$. Right: the sign of $q$ in the plane, with the level curves $q = \pm\frac12, \pm1$; drag $v$. A bowl ($\lambda_1, \lambda_2 > 0$) or a trough (one $\lambda = 0$) is positive; a saddle is not. The skew slider adds $s\begin{bmatrix}0 & -1\\ 1 & 0\end{bmatrix}$: the form does not change at all, but now $T \ne T^*$, so on the real space $\mathbf R^2$ the operator is not positive.`,
      deps: ['ladr-7.10'],
      tags: ['positivity'],
      viz(v) {
        const PRE = { bowl: [1.4, 0.5, 30, 0], trough: [1.5, 0, 30, 0], saddle: [1.3, -0.8, 30, 0], skew: [1.4, 0.5, 30, 0.8] };
        v.select('preset', [{ value: 'bowl', label: 'bowl' }, { value: 'trough', label: 'trough' }, { value: 'saddle', label: 'saddle' }, { value: 'skew', label: 'bowl + skew part' }], 'bowl', { onChange: (k) => { const p = PRE[k]; L1.set(p[0]); L2.set(p[1]); PH.set(p[2]); SK.set(p[3]); } });
        const L1 = v.slider('$\\lambda_1$', -1.5, 2, 1.4, { step: 0.05 });
        const L2 = v.slider('$\\lambda_2$', -1.5, 2, 0.5, { step: 0.05 });
        const PH = v.slider('axis angle (°)', 0, 180, 30, { step: 1 });
        const SK = v.slider('skew part $s$', -1, 1, 0, { step: 0.05 });
        const S3 = v.stage3d({ range: 1.75, height: 360, yaw: -0.65, pitch: 0.45, labels: ['x', 'y', 'q'], weight: 1.15, title: '$q(v) = \\langle Tv, v\\rangle$ over the unit disc' });
        const P = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 360, title: 'sign of $q$; level curves $q = \\pm\\frac12, \\pm1$' });
        const vh = P.handle(0.85, 0.45, { color: 'gold', label: 'v' });
        let st = null;
        v.render(() => {
          const phi = PH.value / DEG, l1 = L1.value, l2 = L2.value, s = SK.value, Sy = symFrom(l1, l2, phi);
          const T = [[Sy[0][0], Sy[0][1] - s], [Sy[1][0] + s, Sy[1][1]]];
          const q = (x, y) => dot(mv(T, [x, y]), [x, y]);
          S3.surface((r, w) => { const x = r * Math.cos(w), y = r * Math.sin(w); return [x, y, q(x, y)]; }, [0, 1], [0, TAU], {
            nu: 12, nv: 48, alpha: 0.86, colorFn: (r, w, p) => (p[2] >= 0 ? v.mix('teal', 'green', Math.min(1, p[2] / 1.5)) : v.mix('orange', 'red', Math.min(1, -p[2]))),
          });
          const ring = []; for (let k = 0; k <= 64; k++) ring.push([Math.cos((TAU * k) / 64), Math.sin((TAU * k) / 64), 0]);
          S3.path(ring, { color: 'muted', width: 1 });
          const e1 = [Math.cos(phi), Math.sin(phi)], e2 = [-e1[1], e1[0]];
          S3.line([-1.2 * e1[0], -1.2 * e1[1], 0], [1.2 * e1[0], 1.2 * e1[1], 0], { color: 'purple', width: 1.4 });
          S3.line([-1.2 * e2[0], -1.2 * e2[1], 0], [1.2 * e2[0], 1.2 * e2[1], 0], { color: 'purple', width: 1.4, dash: true });
          const vx = vh.x, vy = vh.y, vq = q(vx, vy), r0 = Math.hypot(vx, vy), cl = r0 > 1 ? 1 / r0 : 1;
          S3.line([vx * cl, vy * cl, 0], [vx * cl, vy * cl, q(vx * cl, vy * cl)], { color: 'gold', width: 2 });
          S3.dot([vx * cl, vy * cl, q(vx * cl, vy * cl)], { r: 5, color: 'gold' });
          // plane picture
          const G = v.rgb('green'), Rr = v.rgb('red'), BG = v.rgb('panel');
          P.raster((x, y) => { const z = q(x, y), C = z >= 0 ? G : Rr, k = Math.min(1, Math.abs(z) / 2) * 0.5; return [0, 1, 2].map((i) => BG[i] + (C[i] - BG[i]) * k); }, { key: `${l1}|${l2}|${phi}|${BG.join(',')}`, res: 3 });
          P.axes();
          const Qd = (t) => q(Math.cos(t), Math.sin(t));
          for (const lev of [-1, -0.5, 0.5, 1]) {
            const pts = [];
            for (let k = 0; k <= 360; k++) { const t = (TAU * k) / 360, Qt = Qd(t), r = lev / Qt; pts.push(r > 0 && Math.sqrt(r) < 2.5 ? [Math.sqrt(r) * Math.cos(t), Math.sqrt(r) * Math.sin(t)] : null); }
            P.path(pts, { color: lev > 0 ? 'green' : 'red', width: Math.abs(lev) === 1 ? 1.8 : 1.1 });
          }
          // zero set of q, from the eigen-coordinates q = l1 ξ² + l2 η²
          const zeroDirs = l1 * l2 < 0 ? [Math.atan(Math.sqrt(-l1 / l2)), -Math.atan(Math.sqrt(-l1 / l2))].map((a) => phi + a) : Math.abs(l2) < 1e-9 && Math.abs(l1) > 1e-9 ? [phi + Math.PI / 2] : Math.abs(l1) < 1e-9 && Math.abs(l2) > 1e-9 ? [phi] : [];
          for (const a of zeroDirs) P.line(-2.4 * Math.cos(a), -2.4 * Math.sin(a), 2.4 * Math.cos(a), 2.4 * Math.sin(a), { color: 'purple', width: 2, dash: [6, 4] });
          const Tv = mv(T, [vx, vy]);
          P.arrow(0, 0, Tv[0], Tv[1], { color: 'accent', width: 2.2 });
          P.tex('Tv', Tv[0], Tv[1], { color: 'accent', dx: 14, dy: -8, size: 14 });
          P.arrow(0, 0, vx, vy, { color: 'gold', width: 2.2 });
          const sa = Math.abs(s) < 1e-9, pos = Math.min(l1, l2) >= -1e-9, okPos = pos && sa;
          P.corner(`q(v) = ${pn(vq, 3)}`, 'tl', { color: vq >= 0 ? 'green' : 'red', weight: 700 });
          const kind = !pos ? 'saddle or dome: not positive' : !sa ? 'form ≥ 0, but T ≠ T*: not positive' : Math.min(l1, l2) > 1e-9 ? 'bowl: positive (and invertible)' : 'trough: positive, not invertible';
          S3.tex(`\\text{${kind.replace(/≥/, '\\ge').replace(/≠/, '\\ne')}}`, [0, 0, -1.55], { color: okPos ? 'green' : 'red', size: 13 });
          let mn = Infinity; for (let k = 0; k < 720; k++) mn = Math.min(mn, Qd((Math.PI * k) / 720));
          mn = Math.min(mn, Qd(phi), Qd(phi + Math.PI / 2));
          st = { T, l1, l2, mn, sa, okPos, vq };
        });
        v.legend([['green', '$q > 0$'], ['red', '$q < 0$'], ['purple', 'eigen-axes / zero set of $q$', { dash: true }], ['accent', '$Tv$']]);
        v.readout(() => st && `$T = ${mtex(st.T)},\\quad \\min_{\\|v\\| = 1}\\langle Tv, v\\rangle = ${tn(st.mn, 3)},\\quad T ${st.sa ? '= T^*' : '\\ne T^*'}$` + (st.okPos ? ' — self-adjoint and the form is never negative: **positive**.' : st.mn < -1e-9 ? ` — the form takes negative values (in the red directions): **not positive**.` : ' — the form is never negative, but $T$ is not self-adjoint: **not positive** (the skew part is invisible in $\\langle Tv, v\\rangle$).'));
      },
    },
    // ------------------------------------------------------------------ 7.38
    {
      num: '7.38',
      kind: 'Theorem',
      name: 'Characterizations of positive operators',
      statement: String.raw`Let $T \in \mathcal L(V)$. Then the following are equivalent:
(a) $T$ is a positive operator;
(b) $T$ is self-adjoint and all eigenvalues of $T$ are nonnegative;
(c) with respect to some orthonormal basis of $V$, the matrix of $T$ is diagonal with only nonnegative numbers on the diagonal;
(d) $T$ has a positive square root;
(e) $T$ has a self-adjoint square root;
(f) $T = R^*R$ for some $R \in \mathcal L(V)$.`,
      idea: String.raw`Go around the circle. (a)⇒(b): if $Tv = \lambda v$ with $v \ne 0$, then $0 \le \langle Tv, v\rangle = \lambda\|v\|^2$. (b)⇒(c) is the spectral theorem (7.29, 7.31). (c)⇒(d): define $R$ by $Re_k = \sqrt{\lambda_k}\,e_k$ in that basis. (d)⇒(e) because positive operators are self-adjoint. (e)⇒(f): $T = R^2 = R^*R$. (f)⇒(a): $(R^*R)^* = R^*R$ and $\langle R^*Rv, v\rangle = \|Rv\|^2 \ge 0$. Each condition is the operator version of a way to say that a complex number is $\ge 0$.`,
      caption: String.raw`A symmetric $2\times2$ matrix $\begin{bmatrix} a & b\\ b & d\end{bmatrix}$ is a point of $\mathbf R^3$ with coordinates $\big(b, \frac{a-d}2, \frac{a+d}2\big)$: the height is the mean of the two eigenvalues and the distance from the vertical axis (orange) is half their gap, so the eigenvalues (purple dots on the axis) are height ± distance. The positive operators fill the green cone. Drag $T$ (it snaps onto the cone's surface and onto the axis $\lambda I$): the six conditions on the right are each tested by their own computation, and they switch on and off together exactly as $T$ crosses the cone.`,
      deps: ['ladr-7.34', 'ladr-7.29', 'ladr-7.31'],
      tags: ['positivity'],
      viz(v) {
        const PRE = { in: [0.35, 0.25, 0.85], edge: [0.42, 0.42, 0.594], out: [0.6, -0.55, 0.35] };
        v.select('start', [{ value: 'in', label: 'inside the cone' }, { value: 'edge', label: 'on its surface' }, { value: 'out', label: 'outside' }], 'in', { onChange: (k) => hT.set(PRE[k]) });
        const S = v.stage({ x: [-1.75, 1.75], y: [-1.5, 1.8], equal: true, axes: false, height: 400, weight: 1.15, title: 'symmetric $T$ as the point $\\big(b, \\frac{a-d}2, \\frac{a+d}2\\big)$' });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.26, axis: 1.3, lim: 1.4, labels: ['b', '(a−d)/2', '(a+d)/2'] });
        const hT = sc.handle(PRE.in, {
          color: 'gold', label: 'T', snap: (p) => {
            const r = Math.hypot(p[0], p[1]);
            if (r < 0.05) return [0, 0, p[2]];
            if (p[2] > 0.06 && Math.abs(r - p[2]) < 0.06) return [(p[0] * p[2]) / r, (p[1] * p[2]) / r, p[2]];
            return p;
          },
        });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 1, title: 'the six conditions of the theorem' });
        let st = null;
        v.render(() => {
          const [X, Y, Zh] = hT.p, a = Zh + Y, d = Zh - Y, b = X, T = [[a, b], [b, d]], r = Math.hypot(X, Y);
          const e = esym2(T), [lam1, lam2] = e.l, tol = -1e-9, pos = lam2 >= tol;
          // cone
          sc.begin();
          const H = 1.4;
          for (let k = 0; k < 24; k++) {
            const t0 = (TAU * k) / 24, t1 = (TAU * (k + 1)) / 24;
            for (const [z0, z1] of [[0, 0.7], [0.7, H]]) sc.poly([[z0 * Math.cos(t0), z0 * Math.sin(t0), z0], [z1 * Math.cos(t0), z1 * Math.sin(t0), z1], [z1 * Math.cos(t1), z1 * Math.sin(t1), z1], [z0 * Math.cos(t1), z0 * Math.sin(t1), z0]], { fill: 'green', fillAlpha: 0.06, edge: false });
          }
          for (const z of [0.35, 0.7, 1.05, H]) { const pts = []; for (let k = 0; k <= 48; k++) pts.push([z * Math.cos((TAU * k) / 48), z * Math.sin((TAU * k) / 48), z]); sc.path(pts, { color: 'green', alpha: z === H ? 0.7 : 0.35, width: 1 }); }
          for (let k = 0; k < 12; k++) sc.line(ZERO3, [H * Math.cos((TAU * k) / 12), H * Math.sin((TAU * k) / 12), H], { color: 'green', alpha: 0.25, width: 1 }, 6);
          sc.line([0, 0, -1.4], [0, 0, 1.6], { color: 'muted', width: 1.2, alpha: 0.6 }, 12);
          sc.line([0, 0, Zh], hT.p, { color: 'orange', width: 2.4 }, 4);
          sc.line([0, 0, lam2], [0, 0, lam1], { color: 'purple', width: 3, alpha: 0.6 }, 6);
          sc.dot([0, 0, lam1], { r: 5, color: 'purple' });
          sc.dot([0, 0, lam2], { r: 5, color: pos ? 'purple' : 'red' });
          sc.tex('\\lambda_1', [0, 0, lam1], { color: 'purple', dx: -16, size: 14 });
          sc.tex('\\lambda_2', [0, 0, lam2], { color: pos ? 'purple' : 'red', dx: -16, size: 14 });
          sc.tex('\\lambda I', [0, 0, 1.6], { color: 'muted', dx: 14, size: 13 });
          sc.flush();
          S.corner(pos ? (lam2 > 1e-9 ? 'inside the cone' : 'on the cone: λ₂ = 0') : 'outside the cone: λ₂ < 0', 'tl', { color: pos ? 'green' : 'red', weight: 700 });
          // (a) the form, sampled around the circle (plus the eigen-directions)
          const q = (t) => a * Math.cos(t) ** 2 + 2 * b * Math.cos(t) * Math.sin(t) + d * Math.sin(t) ** 2;
          let mn = Infinity, at = 0;
          for (const t of [...Array.from({ length: 720 }, (_, k) => (Math.PI * k) / 720), e.phi, e.phi + Math.PI / 2]) { const z = q(t); if (z < mn) { mn = z; at = t; } }
          const okA = mn >= tol;
          // (d) the spectral square root, tested by squaring
          let Rd = null; if (pos) { Rd = symFrom(Math.sqrt(Math.max(0, lam1)), Math.sqrt(Math.max(0, lam2)), e.phi); if (fro(msub(mm(Rd, Rd), T)) > 1e-8) Rd = null; }
          // (e) how many self-adjoint square roots
          const nE = !pos ? 0 : lam1 < 1e-9 ? 1 : Math.abs(lam1 - lam2) < 1e-9 ? Infinity : lam2 < 1e-9 ? 2 : 4;
          // (f) Cholesky: T = R*R with R upper triangular
          let Rf = null, why = '';
          if (a > 1e-12) { const s = d - (b * b) / a; if (s >= -1e-9) Rf = [[Math.sqrt(a), b / Math.sqrt(a)], [0, Math.sqrt(Math.max(0, s))]]; else why = `fails: d − b²/a = ${pn(s)} < 0`; }
          else if (a > -1e-12 && Math.abs(b) < 1e-9 && d >= tol) Rf = [[0, 0], [0, Math.sqrt(Math.max(0, d))]];
          else why = a < 0 ? `fails: a = ${pn(a)} < 0 has no square root` : 'fails: a = 0 but b ≠ 0';
          const fm = (R) => `[${pn(R[0][0])} ${pn(R[0][1])}; ${pn(R[1][0])} ${pn(R[1][1])}]`;
          const rows = [
            [okA, '\\text{(a) } \\langle Tv, v\\rangle \\ge 0 \\text{ for all } v', okA ? `min over unit v: ${pn(mn, 3)}` : `⟨Tv, v⟩ = ${pn(mn, 3)} at v = (${pn(Math.cos(at))}, ${pn(Math.sin(at))})`],
            [pos, '\\text{(b) } T = T^*,\\ \\text{eigenvalues} \\ge 0', `eigenvalues ${pn(lam1, 3)} and ${pn(lam2, 3)}`],
            [pos, '\\text{(c) diagonal} \\ge 0 \\text{ in an orthonormal basis}', `diag(${pn(lam1)}, ${pn(lam2)}) in the basis at ${pn(((e.phi * DEG) + 180) % 180, 0)}°`],
            [!!Rd, '\\text{(d) a positive square root}', Rd ? `√T = ${fm(Rd)}` : `would need √(${pn(lam2)})`],
            [nE > 0, '\\text{(e) a self-adjoint square root}', nE === Infinity ? 'infinitely many (T = λI)' : nE === 4 ? 'four: eigenvalues ±√λ₁, ±√λ₂' : nE === 2 ? 'two: ±√λ₁ and 0' : nE === 1 ? 'one: R = 0' : 'none: R² = T would give μ² = λ₂ < 0'],
            [!!Rf, '\\text{(f) } T = R^*R \\text{ for some } R', Rf ? `R = ${fm(Rf)} (Cholesky)` : why],
          ];
          rows.forEach(([ok, lab, wit], k) => {
            const y = 0.9 - k * 0.158;
            B.dot(0.055, y, { r: 8, color: ok ? 'green' : 'red' });
            B.tex(lab, 0.11, y + 0.032, { align: 'left', size: 14 });
            B.text(wit, 0.11, y - 0.042, { size: 11.5, color: ok ? 'muted' : 'red' });
          });
          st = { T, lam1, lam2, Zh, r, pos, agree: rows.every((x) => x[0] === rows[0][0]) };
        });
        v.readout(() => st && `$T = ${mtex(st.T)}$, eigenvalues $${tn(st.lam1, 3)}$ and $${tn(st.lam2, 3)}$ $=$ height $\\pm$ distance from the axis $= ${tn(st.Zh, 3)} \\pm ${tn(st.r, 3)}$` + (st.agree ? ` — all six conditions ${st.pos ? 'hold' : 'fail'} together: $T$ is ${st.pos ? '' : '**not** '}positive.` : ' — (conditions disagree: numerical edge case).'));
      },
    },
    // ------------------------------------------------------------------ 7.39
    {
      num: '7.39',
      kind: 'Theorem',
      name: 'Each positive operator has one positive square root',
      statement: String.raw`Every positive operator $T$ on $V$ has a unique positive square root, that is, a unique positive operator $R$ with $R^2 = T$. It is denoted $\sqrt T$.`,
      idea: String.raw`Existence is 7.38(c)⇒(d). For uniqueness, let $R$ be any positive square root and $Tv = \lambda v$. By the spectral theorem $R$ has an orthonormal eigenbasis $e_k$ with $Re_k = \sqrt{\lambda_k}\,e_k$, $\lambda_k \ge 0$. Writing $v = \sum a_ke_k$, the equation $R^2v = \lambda v$ forces $a_k = 0$ unless $\lambda_k = \lambda$, so $Rv = \sqrt\lambda\,v$. Thus $R$ is pinned down on an eigenbasis of $T$. Other square roots exist — infinitely many when an eigenvalue repeats — but they have a negative eigenvalue somewhere.`,
      caption: String.raw`Set the eigenvalues $\lambda_1, \lambda_2$ and axis of $T$. Purple: $T$(unit circle); blue: $R$(unit circle) for the chosen square root $R$. The gold chain shows $v \to Rv \to R(Rv)$, which ends on $Tv$ (dashed) because $R^2 = T$. The positive root $\sqrt T$ stretches the same axes by $\sqrt{\lambda_k}$ — exactly half the stretch on a logarithmic scale, as the right panel shows. The other roots flip a direction ($-\sqrt\lambda$) and then $\langle Rv, v\rangle < 0$ on the red arcs; when $\lambda_1 = \lambda_2$ every reflection, scaled by $\sqrt\lambda$, is a root too (mirror slider). Push $\lambda_2$ below $0$ and every square root disappears.`,
      deps: ['ladr-7.38', 'ladr-7.29', 'ladr-7.31'],
      see: ['fa-12.32'],
      tags: ['positivity'],
      viz(v) {
        const Rsel = v.select('square root $R$', [{ value: 'pos', label: '$\\sqrt T$' }, { value: 'neg', label: '$-\\sqrt T$' }, { value: 'f1', label: 'flip $e_1$' }, { value: 'f2', label: 'flip $e_2$' }, { value: 'refl', label: 'reflection type' }], 'pos', { onChange: (k) => { if (k === 'refl') L2.set(L1.value); } });
        const L1 = v.slider('$\\lambda_1$', -1, 4, 2.6, { step: 0.05 });
        const L2 = v.slider('$\\lambda_2$', -1, 4, 0.6, { step: 0.05 });
        const AX = v.slider('axis angle (°)', 0, 180, 25, { step: 1 });
        const PS = v.slider('mirror angle $\\psi$ (°)', 0, 180, 70, { step: 1 });
        const S = v.stage({ x: [-2.5, 2.5], y: [-2.3, 2.3], equal: true, height: 390, weight: 1.4 });
        const G = v.stage({ x: [0.4, 2.6], y: [0.05, 10], ylog: true, height: 390, weight: 0.6, axes: 'box', xticks: [[1, 'along e₁'], [2, 'along e₂']], title: 'stretch factors (log scale)' });
        const vh = S.handle(Math.cos(2), Math.sin(2), { color: 'gold', label: 'v', constrain: (x, y) => { const t = Math.atan2(y, x); return [Math.cos(t), Math.sin(t)]; } });
        let st = null;
        v.render(() => {
          const l1 = L1.value, l2 = L2.value, phi = AX.value / DEG, T = symFrom(l1, l2, phi), kind = Rsel.value;
          PS.el.hidden = kind !== 'refl';
          const pos = l1 >= 0 && l2 >= 0, s1 = Math.sqrt(Math.max(0, l1)), s2 = Math.sqrt(Math.max(0, l2));
          let R = null, sg = [1, 1];
          if (pos) {
            if (kind === 'pos') R = symFrom(s1, s2, phi);
            else if (kind === 'neg') { R = symFrom(-s1, -s2, phi); sg = [-1, -1]; }
            else if (kind === 'f1') { R = symFrom(-s1, s2, phi); sg = [-1, 1]; }
            else if (kind === 'f2') { R = symFrom(s1, -s2, phi); sg = [1, -1]; }
            else { const p2 = (2 * PS.value) / DEG; R = [[s1 * Math.cos(p2), s1 * Math.sin(p2)], [s1 * Math.sin(p2), -s1 * Math.cos(p2)]]; sg = null; }
          }
          const err = R ? fro(msub(mm(R, R), T)) : Infinity, root = err < 1e-9, er = R ? esym2(R) : null, Rpos = er && er.l[1] >= -1e-9;
          const rad = Math.max(2.2, 1.12 * Math.max(Math.abs(l1), Math.abs(l2), er ? Math.abs(er.l[0]) : 0, er ? Math.abs(er.l[1]) : 0, R ? sv2(mm(R, R)).smax : 0));
          S.setView([-rad, rad], [-0.92 * rad, 0.92 * rad]);
          const e1 = [Math.cos(phi), Math.sin(phi)], e2 = [-e1[1], e1[0]];
          for (const e of [e1, e2]) S.line(-1.5 * rad * e[0], -1.5 * rad * e[1], 1.5 * rad * e[0], 1.5 * rad * e[1], { color: 'green', width: 1, alpha: 0.45, dash: [3, 4] });
          S.tex('e_1', 0.93 * rad * e1[0], 0.93 * rad * e1[1], { color: 'green', size: 14, dy: -12 });
          S.circle(0, 0, 1, { color: 'muted', dash: [4, 4], width: 1 });
          S.path(imgCircle(T), { close: true, color: pos ? 'purple' : 'red', width: 2, fill: pos ? 'purple' : 'red', fillAlpha: 0.05 });
          const vv = [vh.x, vh.y], Tv = mv(T, vv);
          if (R) {
            S.path(imgCircle(R), { close: true, color: 'accent', width: 2, fill: 'accent', fillAlpha: 0.08 });
            if (!root) S.path(imgCircle(mm(R, R)), { close: true, color: 'red', width: 1.6, dash: [5, 4] });
            const arcs = []; for (let k = 0; k <= 360; k++) { const t = (TAU * k) / 360, w = [Math.cos(t), Math.sin(t)]; arcs.push(dot(mv(R, w), w) < -1e-9 ? w : null); }
            S.path(arcs, { color: 'red', width: 5, alpha: 0.75 });
            const Rv = mv(R, vv), RRv = mv(R, Rv);
            S.arrow(0, 0, Tv[0], Tv[1], { color: 'purple', width: 2, dash: [6, 4] });
            S.path([vv, Rv, RRv], { color: 'gold', width: 1.4, alpha: 0.7, dash: [2, 3] });
            S.arrow(0, 0, Rv[0], Rv[1], { color: 'accent', width: 2.4 });
            S.arrow(0, 0, RRv[0], RRv[1], { color: 'purple', width: 2.4 });
            S.tex('Rv', Rv[0], Rv[1], { color: 'accent', dx: 14, dy: -10, size: 14 });
            S.tex(root ? 'R^2v = Tv' : 'R^2v', RRv[0], RRv[1], { color: 'purple', dx: 16, dy: 12, size: 14, align: 'left' });
          } else {
            S.arrow(0, 0, Tv[0], Tv[1], { color: 'red', width: 2.2 });
            S.tex('Tv', Tv[0], Tv[1], { color: 'red', dx: 14, dy: -10, size: 14 });
          }
          S.arrow(0, 0, vv[0], vv[1], { color: 'gold', width: 2.4 });
          S.corner(!pos ? 'T is not positive: no positive square root' : !root ? 'R² ≠ T' : Rpos ? 'R² = T and R is positive: R = √T' : 'R² = T, but R is not positive', 'tl', { color: !pos || !root ? 'red' : Rpos ? 'green' : 'orange', weight: 700 });
          // log panel: 1 → √λ → λ along each eigen-axis
          G.hline(1, { color: 'muted', width: 1, dash: [4, 4] });
          [l1, l2].forEach((l, k) => {
            const x = k + 1;
            if (l <= 0) { G.text(`λ${k ? '₂' : '₁'} = ${pn(l)} ≤ 0`, x, 0.07, { align: 'center', color: 'red', size: 12 }); return; }
            const sq = Math.sqrt(l), yc = (y) => clamp(y, 0.055, 9.5);
            G.arrow(x - 0.12, 1, x - 0.12, yc(sq), { color: 'accent', width: 1.6, head: 7 });
            G.arrow(x + 0.12, yc(sq), x + 0.12, yc(l), { color: 'purple', width: 1.6, head: 7 });
            G.dot(x, yc(l), { r: 5.5, color: 'purple', label: `λ = ${pn(l)}`, labelPos: 'e' });
            const neg = sg ? sg[k] < 0 : false;
            G.dot(x, yc(sq), { r: 5.5, color: neg ? 'red' : 'accent', label: sg ? `${neg ? '−' : ''}√λ = ${neg ? '−' : ''}${pn(sq)}` : `±√λ = ±${pn(sq)}`, labelPos: 'e' });
            G.dot(x, 1, { r: 4, hollow: true, color: 'muted' });
          });
          st = { T, R, root, Rpos, err, pos, l1, l2, er, kind };
        });
        v.legend([['purple', '$T$(unit circle), $R^2v$'], ['accent', '$R$(unit circle), $Rv$'], ['red', '$\\langle Rv, v\\rangle < 0$'], ['green', 'eigen-axes of $T$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (!st.pos) return `$T = ${mtex(st.T)}$ has the eigenvalue $${tn(Math.min(st.l1, st.l2))} < 0$, so it is not positive and has no positive (indeed no self-adjoint) square root` + (st.l1 * st.l2 < 0 ? `; since $\\det T = ${tn(st.l1 * st.l2)} < 0$ while $\\det(R^2) = (\\det R)^2 \\ge 0$, it has no real square root at all.` : '.');
          const head = `$R = ${mtex(st.R)},\\quad R^2 = ${mtex(mm(st.R, st.R))},\\quad T = ${mtex(st.T)}$`;
          if (!st.root) return head + ` — $R^2 \\ne T$: reflection-type roots exist only when $\\lambda_1 = \\lambda_2$ (then $T = \\lambda I$).`;
          return head + (st.Rpos ? ` — $R^2 = T$ and $R$ has eigenvalues $${tn(st.er.l[0])}, ${tn(st.er.l[1])} \\ge 0$: this is $\\sqrt T$, the only positive square root.` : ` — $R^2 = T$, but $R$ has the eigenvalue $${tn(st.er.l[1])} < 0$, so it is a square root that is not positive.`);
        });
      },
    },
    // ------------------------------------------------------------------ 7.43
    {
      num: '7.43',
      kind: 'Theorem',
      name: 'T positive and ⟨Tv, v⟩ = 0 ⟹ Tv = 0',
      statement: String.raw`Suppose $T$ is a positive operator on $V$ and $v \in V$ satisfies $\langle Tv, v\rangle = 0$. Then $Tv = 0$.`,
      idea: String.raw`Factor through the square root (7.39): $0 = \langle Tv, v\rangle = \langle \sqrt T\sqrt T v, v\rangle = \langle \sqrt T v, \sqrt T v\rangle = \|\sqrt T v\|^2$, using that $\sqrt T$ is self-adjoint. So $\sqrt T v = 0$, and then $Tv = \sqrt T(\sqrt T v) = 0$. Both hypotheses matter: an indefinite self-adjoint operator has directions with $\langle Tv, v\rangle = 0$ but $Tv \ne 0$, and so does an operator whose form is $\ge 0$ but which is not self-adjoint.`,
      caption: String.raw`Drag the unit vector $v$ (gold); it snaps to the directions where $\langle Tv, v\rangle = 0$ (purple dashed lines). Blue: $Tv$; green: $\sqrt T v$, defined when $T$ is positive. Right: around the circle, $\langle Tv, v\rangle$ (purple), $\|Tv\|$ (blue) and $\|\sqrt T v\|^2$ (green dashed, the same curve as purple). For the positive singular $T$ the form touches $0$ exactly along the null space (orange), where $Tv = 0$ as well (green dot). For the indefinite or the non-self-adjoint operator the form vanishes where $\|Tv\| > 0$ (red dots).`,
      deps: ['ladr-7.34', 'ladr-7.39'],
      tags: ['positivity'],
      viz(v) {
        const PRE = { sing: symFrom(1.6, 0, 0.6), inv: symFrom(1.5, 0.5, 0.6), indef: symFrom(1.4, -0.7, 0.6), nonsa: [[1, -1], [1, 0]] };
        const which = v.select('$T$', [{ value: 'sing', label: 'positive, singular' }, { value: 'inv', label: 'positive, invertible' }, { value: 'indef', label: 'self-adjoint, indefinite' }, { value: 'nonsa', label: 'form $\\ge 0$, not self-adjoint' }], 'sing');
        const S = v.stage({ x: [-2, 2], y: [-1.8, 1.8], equal: true, height: 370, weight: 1.05 });
        const G = v.stage({ x: [0, 180], y: [-1, 2], height: 370, xlabel: 'θ (degrees)', xticks: [0, 45, 90, 135, 180], title: 'around the unit circle, $v = (\\cos\\theta, \\sin\\theta)$' });
        // q(θ) = (a+d)/2 + (a−d)/2 cos2θ + (b+c)/2 sin2θ
        const zq = (T) => trigZeros((T[0][0] + T[1][1]) / 2, (T[0][0] - T[1][1]) / 2, (T[0][1] + T[1][0]) / 2) || [];
        const vh = S.handle(Math.cos(0.9), Math.sin(0.9), {
          color: 'gold', label: 'v', constrain: (x, y) => {
            let t = Math.atan2(y, x);
            for (const z of zq(PRE[which.value])) for (const k of [-2, -1, 0, 1]) if (Math.abs(t - (z + k * Math.PI)) < 4 / DEG) t = z + k * Math.PI;
            return [Math.cos(t), Math.sin(t)];
          },
        });
        let st = null;
        v.render(() => {
          const T = PRE[which.value], sym = Math.abs(T[0][1] - T[1][0]) < 1e-12, e = esym2(T), pos = sym && e.l[1] >= -1e-9;
          const R = pos ? symFrom(Math.sqrt(e.l[0]), Math.sqrt(Math.max(0, e.l[1])), e.phi) : null;
          const zs = zq(T), sing = Math.abs(T[0][0] * T[1][1] - T[0][1] * T[1][0]) < 1e-9;
          drawEllipse(S, T, { color: 'accent', alpha: 0.5, fillAlpha: 0.05 });
          if (sing) { const n = evec2(T, 0); if (n) { S.line(-2.6 * n[0], -2.6 * n[1], 2.6 * n[0], 2.6 * n[1], { color: 'orange', width: 3, alpha: 0.55 }); S.tex('\\operatorname{null} T', 1.55 * n[0], 1.55 * n[1], { color: 'orange', dx: 34, size: 13 }); } }
          for (const z of zs) S.line(-2.6 * Math.cos(z), -2.6 * Math.sin(z), 2.6 * Math.cos(z), 2.6 * Math.sin(z), { color: 'purple', width: 1.6, dash: [6, 4] });
          const vv = [vh.x, vh.y], Tv = mv(T, vv), q = dot(Tv, vv), nT = len(Tv);
          if (nT > 1e-9) { S.arrow(0, 0, Tv[0], Tv[1], { color: 'accent', width: 2.4 }); S.tex('Tv', Tv[0], Tv[1], { color: 'accent', dx: 14, dy: -8, size: 14 }); }
          if (R) { const Rv = mv(R, vv); if (len(Rv) > 1e-9) { S.arrow(0, 0, Rv[0], Rv[1], { color: 'green', width: 2.2 }); S.tex('\\sqrt T v', Rv[0], Rv[1], { color: 'green', dx: 18, dy: 10, size: 13 }); } }
          S.arrow(0, 0, vv[0], vv[1], { color: 'gold', width: 2.4 });
          const zero = Math.abs(q) < 1e-9;
          S.corner(zero ? (nT < 1e-9 ? '⟨Tv, v⟩ = 0 and Tv = 0' : '⟨Tv, v⟩ = 0 but Tv ≠ 0') : `⟨Tv, v⟩ = ${pn(q, 3)}`, 'tl', { color: zero ? (nT < 1e-9 ? 'green' : 'red') : 'muted', weight: 700 });
          const fq = (t) => { const w = [Math.cos(t / DEG), Math.sin(t / DEG)]; return dot(mv(T, w), w); };
          const fn = (t) => len(mv(T, [Math.cos(t / DEG), Math.sin(t / DEG)]));
          let lo = 0, hi = 1; for (let t = 0; t <= 180; t += 2) { lo = Math.min(lo, fq(t)); hi = Math.max(hi, fq(t), fn(t)); }
          G.setView([0, 180], [Math.min(-0.4, 1.15 * lo), 1.15 * hi]);
          G.hline(0, { color: 'muted', width: 1 });
          G.fn(fn, { color: 'accent', width: 2.2 });
          G.fn(fq, { color: 'purple', width: 2.6 });
          if (R) G.fn((t) => len(mv(R, [Math.cos(t / DEG), Math.sin(t / DEG)])) ** 2, { color: 'green', width: 2, dash: [6, 5] });
          for (const z of zs) { const t = z * DEG, n = fn(t), ok = n < 1e-9; G.dot(t, 0, { r: 6, color: ok ? 'green' : 'red' }); if (!ok) { G.line(t, 0, t, n, { color: 'red', width: 1.6, dash: [3, 3] }); G.dot(t, n, { r: 4, color: 'red' }); } }
          const th = (((Math.atan2(vv[1], vv[0]) * DEG) % 180) + 180) % 180;
          G.vline(th, { color: 'gold', width: 1.5 });
          if (!zs.length) G.corner('⟨Tv, v⟩ > 0 for every unit v', 'tr', { color: 'green', weight: 700 });
          st = { T, q, nT, pos, sym, R, rv: R ? len(mv(R, vv)) ** 2 : null };
        });
        v.legend([['purple', '$\\langle Tv, v\\rangle$'], ['accent', '$\\|Tv\\|$'], ['green', '$\\|\\sqrt T v\\|^2$', { dash: true }], ['orange', '$\\operatorname{null} T$']]);
        v.readout(() => st && `$\\langle Tv, v\\rangle = ${tn(st.q, 3)},\\quad \\|Tv\\| = ${tn(st.nT, 3)}$` + (st.pos ? `$,\\quad \\|\\sqrt T v\\|^2 = ${tn(st.rv, 3)}$ — positive $T$: the form is $\\|\\sqrt T v\\|^2$, so it vanishes only where $\\sqrt T v = 0$, and then $Tv = 0$.` : st.sym ? ' — $T$ is self-adjoint but not positive: on the purple lines $\\langle Tv, v\\rangle = 0$ while $Tv \\ne 0$ (in fact $Tv \\perp v$).' : ' — $\\langle Tv, v\\rangle = x^2 \\ge 0$ for $v = (x, y)$, but $T$ is not self-adjoint, hence not positive, and $Tv \\ne 0$ on the zero line.'));
      },
    },
    // ------------------------------------------------------------------ 7.44
    {
      num: '7.44',
      kind: 'Definition',
      name: 'Isometry',
      statement: String.raw`A linear map $S \in \mathcal L(V, W)$ is called an **isometry** if
$$\|Sv\| = \|v\| \quad\text{for every } v \in V;$$
in other words, $S$ preserves norms.`,
      idea: String.raw`*Isos* is Greek for equal and *metron* for measure. An isometry is automatically injective: $Sv = 0$ gives $\|v\| = \|Sv\| = 0$. It need not be surjective when $\dim W > \dim V$, as for the inclusion of a plane into space. Preserving lengths forces preserving angles too (by polarization; see 7.49), so isometries are exactly the rigid linear placements of $V$ inside $W$.`,
      caption: String.raw`A linear map $S: \mathbf R^2 \to \mathbf R^3$ is given by its columns $Se_1$ (teal, drag it over the sphere) and $Se_2$, set by the sliders: its length, its angle with $Se_1$ and its twist about $Se_1$. Drag $v$ and $w$ in the domain on the left. With $\|Se_2\| = 1$ and a right angle, $S$ is an isometry: the unit circle lands on a great circle of the unit sphere (green), and the lengths of $v, w$ and the angle between them are preserved. Change either slider and the image becomes an ellipse that leaves the sphere.`,
      deps: ['ladr-6.7'],
      tags: ['isometries'],
      viz(v) {
        const KS = v.slider('$\\|Se_2\\|$', 0.4, 1.6, 1, { step: 0.05 });
        const AN = v.slider('angle of $Se_1, Se_2$ (°)', 40, 140, 90, { step: 1 });
        const TW = v.slider('twist of $Se_2$ (°)', 0, 360, 40, { step: 1 });
        const D = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, height: 360, weight: 0.8, title: 'domain $\\mathbf R^2$' });
        const vh = D.handle(1, 0.45, { color: 'gold', label: 'v' });
        const wh = D.handle(-0.45, 0.85, { color: 'purple', label: 'w' });
        const S = v.stage({ x: [-1.5, 1.5], y: [-1.45, 1.45], equal: true, axes: false, height: 360, weight: 1.2, title: 'target $\\mathbf R^3$ and its unit sphere' });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.35, axis: 1.3, lim: 1.25 });
        const hn = sc.handle(unit([0.8, -0.3, 0.45]), { color: 'teal', label: 'Se₁', snap: (p) => (len(p) > 1e-3 ? unit(p) : [1, 0, 0]) });
        const ang = (a, b) => Math.acos(clamp(dot(a, b) / (len(a) * len(b) || 1), -1, 1)) * DEG;
        let st = null;
        v.render(() => {
          const c1 = unit(hn.p), [p, q] = perpPair(c1), tw = TW.value / DEG, g = add(scl(p, Math.cos(tw)), scl(q, Math.sin(tw)));
          const al = AN.value / DEG, k = KS.value, c2 = scl(add(scl(c1, Math.cos(al)), scl(g, Math.sin(al))), k);
          const Sm = fromCols([c1, c2]), iso = Math.abs(k - 1) < 1e-9 && Math.abs(AN.value - 90) < 1e-9;
          const vv = [vh.x, vh.y], ww = [wh.x, wh.y], Sv = mv(Sm, vv), Sw = mv(Sm, ww);
          // domain
          D.circle(0, 0, 1, { color: 'accent', width: 2 });
          D.arrow(0, 0, vv[0], vv[1], { color: 'gold', width: 2.4 });
          D.arrow(0, 0, ww[0], ww[1], { color: 'purple', width: 2.4 });
          D.corner(`|v| = ${pn(len(vv))}, |w| = ${pn(len(ww))}, angle ${pn(ang(vv, ww), 1)}°`, 'bl', { color: 'muted' });
          // target
          sc.begin();
          sphere(S, sc);
          sc.disc(c1, g, 1.3, { fill: 'accent', fillAlpha: 0.06, color: 'accent', alpha: 0.25 });
          if (!iso) { const gc = []; for (let j = 0; j <= 72; j++) { const t = (TAU * j) / 72; gc.push(add(scl(c1, Math.cos(t)), scl(g, Math.sin(t)))); } sc.path(gc, { color: 'muted', width: 1, alpha: 0.6, dash: [4, 4] }); }
          const img = []; for (let j = 0; j <= 96; j++) { const t = (TAU * j) / 96; img.push(mv(Sm, [Math.cos(t), Math.sin(t)])); }
          sc.path(img, { color: iso ? 'green' : 'accent', width: 2.6 });
          sc.arrow(ZERO3, c2, { color: 'pink', width: 1.8 });
          sc.tex('Se_2', c2, { color: 'pink', dx: 14, dy: -10, size: 14 });
          sc.arrow(ZERO3, c1, { color: 'teal', width: 1.8 });
          sc.arrow(ZERO3, Sv, { color: 'gold' });
          sc.arrow(ZERO3, Sw, { color: 'purple' });
          sc.tex('Sv', Sv, { color: 'gold', dx: 14, dy: 10, size: 14 });
          sc.tex('Sw', Sw, { color: 'purple', dx: -14, dy: 10, size: 14 });
          sc.flush();
          S.corner(iso ? 'isometry: unit circle → great circle' : 'not an isometry: the image leaves the sphere', 'tl', { color: iso ? 'green' : 'red', weight: 700 });
          st = { iso, nv: len(vv), nSv: len(Sv), nw: len(ww), nSw: len(Sw), a: ang(vv, ww), aS: ang(Sv, Sw), Sm };
        });
        v.legend([['gold', '$v$, $Sv$'], ['purple', '$w$, $Sw$'], ['green', 'image of the unit circle (isometry)'], ['accent', 'unit circle / its image']]);
        v.readout(() => st && `$S = ${mtex(st.Sm)}:\\quad \\|v\\| = ${tn(st.nv, 3)},\\ \\|Sv\\| = ${tn(st.nSv, 3)};\\quad \\|w\\| = ${tn(st.nw, 3)},\\ \\|Sw\\| = ${tn(st.nSw, 3)};\\quad \\angle(v, w) = ${tn(st.a, 1)}^\\circ,\\ \\angle(Sv, Sw) = ${tn(st.aS, 1)}^\\circ$` + (st.iso ? ' — norms (and angles) preserved: an isometry, injective but not onto $\\mathbf R^3$.' : ' — some norm changes: not an isometry.'));
      },
    },
    // ------------------------------------------------------------------ 7.49
    {
      num: '7.49',
      kind: 'Theorem',
      name: 'Characterizations of isometries',
      statement: String.raw`Suppose $S \in \mathcal L(V, W)$, $e_1, \dots, e_n$ is an orthonormal basis of $V$, and $f_1, \dots, f_m$ is an orthonormal basis of $W$. Then the following are equivalent:
(a) $S$ is an isometry;
(b) $S^*S = I$;
(c) $\langle Su, Sv\rangle = \langle u, v\rangle$ for all $u, v \in V$;
(d) $Se_1, \dots, Se_n$ is an orthonormal list in $W$;
(e) the columns of $\mathcal M\big(S, (e_1, \dots, e_n), (f_1, \dots, f_m)\big)$ form an orthonormal list in $\mathbf F^m$ (Euclidean inner product).`,
      idea: String.raw`(a)⇒(b): $\langle (I - S^*S)v, v\rangle = \|v\|^2 - \|Sv\|^2 = 0$ for all $v$, and $I - S^*S$ is self-adjoint, so it is $0$ by 7.16. (b)⇒(c): $\langle Su, Sv\rangle = \langle S^*Su, v\rangle = \langle u, v\rangle$. (c)⇒(d): apply (c) to the $e_j$. (d)⟺(e): the inner products of the columns are the numbers $\langle Se_k, Se_r\rangle$, since the $f_j$ are orthonormal. (e)⇒(a): $Sv = \sum \langle v, e_k\rangle Se_k$, so $\|Sv\|^2 = \sum |\langle v, e_k\rangle|^2 = \|v\|^2$ (6.30). Since (a) does not mention the basis, (d) for one orthonormal basis implies (d) for all of them.`,
      caption: String.raw`Drag the columns $Se_1$ (teal) and $Se_2$ (pink) of a $3\times2$ matrix; they snap to length $1$ and to a right angle. The slider rotates an orthonormal basis $f_1, f_2$ of $\mathbf R^2$ by $\varphi$, and the gold and purple arrows are $Sf_1, Sf_2$. Right: the Gram entries $\|Sf_1\|^2$, $\|Sf_2\|^2$ and $\langle Sf_1, Sf_2\rangle$ against $\varphi$ — the entries of the matrix of $S^*S$ in the rotated basis. The list $Sf_1, Sf_2$ is orthonormal at one angle exactly when it is orthonormal at every angle: either the curves are the flat lines $1, 1, 0$ (an isometry), or they never meet those values all at once.`,
      deps: ['ladr-7.44', 'ladr-7.16', 'ladr-7.1', 'ladr-6.22', 'ladr-6.30'],
      tags: ['isometries'],
      viz(v) {
        const c1 = unit([0.9, -0.3, 0.3]), c2 = unit(cross([0.2, 0.1, 1], c1));
        const PRE = { iso: [c1, c2], stretch: [scl(c1, 1.25), scl(c2, 0.75)], skew: [c1, unit(add(c2, scl(c1, 0.7)))] };
        v.select('$S$', [{ value: 'iso', label: 'isometry' }, { value: 'stretch', label: 'stretched' }, { value: 'skew', label: 'skewed' }], 'iso', { onChange: (k) => { h1.set(PRE[k][0]); h2.set(PRE[k][1]); } });
        const PHI = v.slider('basis angle $\\varphi$ (°)', 0, 180, 25, { step: 1 });
        const S = v.stage({ x: [-1.6, 1.6], y: [-1.5, 1.5], equal: true, axes: false, height: 380, weight: 1.1, title: 'columns $Se_1, Se_2$ of $S: \\mathbf R^2 \\to \\mathbf R^3$' });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.33, axis: 1.3, lim: 1.3 });
        const snapCol = (other) => (p) => {
          let q = p.slice(); const o = other(), ou = unit(o), c = dot(q, ou);
          if (len(o) > 0.2 && Math.abs(c) < 0.07 * len(q)) q = sub(q, scl(ou, c));
          const l = len(q); if (Math.abs(l - 1) < 0.06) q = scl(q, 1 / l);
          return q;
        };
        const h1 = sc.handle(PRE.iso[0], { color: 'teal', label: 'Se₁', snap: snapCol(() => h2.p) });
        const h2 = sc.handle(PRE.iso[1], { color: 'pink', label: 'Se₂', snap: snapCol(() => h1.p) });
        const G = v.stage({ x: [0, 180], y: [-0.8, 1.8], height: 380, xlabel: 'φ (degrees)', xticks: [0, 45, 90, 135, 180], title: 'Gram entries of $Sf_1, Sf_2$' });
        let st = null;
        v.render(() => {
          const a = h1.p, b = h2.p, Sm = fromCols([a, b]), g11 = dot(a, a), g12 = dot(a, b), g22 = dot(b, b), Gm = [[g11, g12], [g12, g22]];
          const iso = fro(msub(Gm, eye(2))) < 1e-9, ph = PHI.value / DEG;
          const f1 = [Math.cos(ph), Math.sin(ph)], f2 = [-f1[1], f1[0]], Sf1 = mv(Sm, f1), Sf2 = mv(Sm, f2);
          sc.begin();
          sphere(S, sc);
          const n = cross(a, b);
          if (len(n) > 1e-6) { const [u, w] = perpPair(n); sc.disc(u, w, 1.35, { fill: 'accent', fillAlpha: 0.05, color: 'accent', alpha: 0.2 }); }
          const img = []; for (let j = 0; j <= 96; j++) { const t = (TAU * j) / 96; img.push(mv(Sm, [Math.cos(t), Math.sin(t)])); }
          sc.path(img, { color: iso ? 'green' : 'accent', width: 2.4 });
          sc.arrow(ZERO3, a, { color: 'teal', width: 1.8 });
          sc.arrow(ZERO3, b, { color: 'pink', width: 1.8 });
          sc.arrow(ZERO3, Sf1, { color: 'gold' });
          sc.arrow(ZERO3, Sf2, { color: 'purple' });
          sc.tex('Sf_1', Sf1, { color: 'gold', dx: 16, dy: 10, size: 14 });
          sc.tex('Sf_2', Sf2, { color: 'purple', dx: -16, dy: 10, size: 14 });
          sc.flush();
          S.corner(iso ? 'Se₁, Se₂ orthonormal: isometry' : 'columns not orthonormal', 'tl', { color: iso ? 'green' : 'red', weight: 700 });
          const G11 = (t) => { const r = t / DEG, c = Math.cos(r), s = Math.sin(r); return g11 * c * c + 2 * g12 * c * s + g22 * s * s; };
          const G22 = (t) => { const r = t / DEG, c = Math.cos(r), s = Math.sin(r); return g11 * s * s - 2 * g12 * c * s + g22 * c * c; };
          const G12 = (t) => { const r = t / DEG, c = Math.cos(r), s = Math.sin(r); return (g22 - g11) * c * s + g12 * (c * c - s * s); };
          const e = esym2(Gm), hi = Math.max(1.6, 1.12 * e.l[0]), lo = Math.min(-0.6, -1.12 * Math.abs(e.l[0] - e.l[1]) / 2 - 0.1);
          G.setView([0, 180], [lo, hi]);
          G.hline(1, { color: 'green', dash: [5, 4], width: 1.4, alpha: 0.8 });
          G.hline(0, { color: 'green', dash: [5, 4], width: 1.4, alpha: 0.8 });
          G.fn(G11, { color: 'gold', width: 2.4 });
          G.fn(G22, { color: 'purple', width: 2.4 });
          G.fn(G12, { color: 'orange', width: 2.4 });
          G.vline(PHI.value, { color: 'muted', width: 1.3 });
          for (const [f, c] of [[G11, 'gold'], [G22, 'purple'], [G12, 'orange']]) G.dot(PHI.value, f(PHI.value), { r: 4.5, color: c });
          st = { Gm, iso, e, d: [G11(PHI.value), G22(PHI.value), G12(PHI.value)], Sm };
        });
        v.legend([['gold', '$\\|Sf_1\\|^2$'], ['purple', '$\\|Sf_2\\|^2$'], ['orange', '$\\langle Sf_1, Sf_2\\rangle$'], ['green', 'target values $1$ and $0$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { e, Gm, d } = st, ok = st.iso, t = 1e-9;
          const dev = Math.max(Math.abs(e.l[0] - 1), Math.abs(e.l[1] - 1)), sdev = Math.max(Math.abs(Math.sqrt(Math.max(0, e.l[0])) - 1), Math.abs(Math.sqrt(Math.max(0, e.l[1])) - 1));
          const dok = Math.abs(d[0] - 1) < t && Math.abs(d[1] - 1) < t && Math.abs(d[2]) < t;
          return `$S^*S = ${mtex(Gm, 3)}$ — ${ok ? 'all five conditions hold:' : 'all five conditions fail:'}
(a) $\\max_{\\|v\\| = 1}\\big|\\|Sv\\| - 1\\big| = ${tn(sdev, 3)}$ ${mark(sdev < t)}
(b) $\\|S^*S - I\\| = ${tn(fro(msub(Gm, eye(2))), 3)}$ ${mark(ok)}
(c) $\\max_{\\|u\\| = \\|v\\| = 1}|\\langle Su, Sv\\rangle - \\langle u, v\\rangle| = ${tn(dev, 3)}$ ${mark(dev < t)}
(d) at $\\varphi = ${PHI.value}^\\circ$: $\\|Sf_1\\|^2 = ${tn(d[0], 3)},\\ \\|Sf_2\\|^2 = ${tn(d[1], 3)},\\ \\langle Sf_1, Sf_2\\rangle = ${tn(d[2], 3)}$ ${mark(dok)}
(e) columns: $\\|Se_1\\|^2 = ${tn(Gm[0][0], 3)},\\ \\|Se_2\\|^2 = ${tn(Gm[1][1], 3)},\\ \\langle Se_1, Se_2\\rangle = ${tn(Gm[0][1], 3)}$ ${mark(ok)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.51
    {
      num: '7.51',
      kind: 'Definition',
      name: 'Unitary operator',
      statement: String.raw`An operator $S \in \mathcal L(V)$ is called **unitary** if $S$ is an invertible isometry.`,
      idea: String.raw`On a finite-dimensional space the word *invertible* is redundant: an isometry is injective, and an injective operator is invertible (3.65); it is kept for consistency with infinite-dimensional spaces, where the shift $(x_1, x_2, \dots) \mapsto (0, x_1, x_2, \dots)$ is an isometry that is not onto. Unitary operators correspond to the complex numbers of absolute value $1$. On $\mathbf R^2$ they are exactly the rotations and the reflections — the rigid motions fixing $0$.`,
      caption: String.raw`Drag $Se_1$ (teal) around the unit circle. In rotation mode $Se_2$ is $Se_1$ turned by $+90^\circ$, in reflection mode by $-90^\circ$. Either way the unit circle is carried onto itself (green) and the letter F keeps its shape and size; a reflection mirrors it across the orange line and has $\det S = -1$, a rotation keeps its orientation and has $\det S = 1$. Switch to *any operator* and drag both columns: the circle turns into an ellipse and the F is sheared or stretched — no longer unitary.`,
      deps: ['ladr-7.44', 'ladr-3.59'],
      tags: ['isometries'],
      viz(v) {
        const snap = (x) => Math.round(x * 10) / 10;
        const mode = v.select('$S$', [{ value: 'rot', label: 'rotation' }, { value: 'ref', label: 'reflection' }, { value: 'any', label: 'any operator' }], 'rot', {
          onChange: (m) => { if (m === 'any') { h1.set(1.2, 0.4); h2.set(-0.3, 0.8); } else { const t = Math.atan2(h1.y, h1.x); h1.set(Math.cos(t), Math.sin(t)); } },
        });
        const S = v.stage({ x: [-2.1, 2.1], y: [-1.8, 1.8], equal: true, height: 380 });
        const h1 = S.handle(Math.cos(0.6), Math.sin(0.6), {
          color: 'teal', label: 'Se₁', constrain: (x, y) => {
            if (mode.value === 'any') return [snap(x), snap(y)];
            let t = Math.atan2(y, x); const dd = Math.round(t / (TAU / 72)) * (TAU / 72); if (Math.abs(t - dd) < 0.03) t = dd;
            return [Math.cos(t), Math.sin(t)];
          },
        });
        const h2 = S.handle(-0.3, 0.8, { color: 'pink', label: 'Se₂', constrain: (x, y) => [snap(x), snap(y)] });
        const F = [[-0.35, -0.6], [-0.12, -0.6], [-0.12, -0.08], [0.28, -0.08], [0.28, 0.14], [-0.12, 0.14], [-0.12, 0.38], [0.4, 0.38], [0.4, 0.6], [-0.35, 0.6]].map(([x, y]) => [x + 0.45, y + 0.15]);
        let st = null;
        v.render(() => {
          const m = mode.value, c1 = [h1.x, h1.y];
          h2.visible = m === 'any';
          const c2 = m === 'rot' ? [-c1[1], c1[0]] : m === 'ref' ? [c1[1], -c1[0]] : [h2.x, h2.y];
          const Sm = [[c1[0], c2[0]], [c1[1], c2[1]]], StS = mm(tr(Sm), Sm), dev = fro(msub(StS, eye(2))), uni = dev < 1e-9, det = Sm[0][0] * Sm[1][1] - Sm[0][1] * Sm[1][0];
          for (let i = -3; i <= 3; i++) {
            const p = mv(Sm, [i * 0.5, -1.5]), q = mv(Sm, [i * 0.5, 1.5]), r = mv(Sm, [-1.5, i * 0.5]), s = mv(Sm, [1.5, i * 0.5]);
            S.line(p[0], p[1], q[0], q[1], { color: 'accent', width: 1, alpha: 0.18 }); S.line(r[0], r[1], s[0], s[1], { color: 'accent', width: 1, alpha: 0.18 });
          }
          S.circle(0, 0, 1, { color: 'muted', dash: [4, 4], width: 1 });
          S.path(imgCircle(Sm), { close: true, color: uni ? 'green' : 'red', width: 2.4 });
          S.poly(F, { color: 'muted', dash: [4, 3], width: 1.2, fill: false });
          S.poly(F.map((p) => mv(Sm, p)), { color: 'accent', width: 1.8, fill: 'accent', fillAlpha: 0.25 });
          const th = Math.atan2(c1[1], c1[0]);
          if (m === 'ref') { const a = th / 2; S.line(-2.6 * Math.cos(a), -2.6 * Math.sin(a), 2.6 * Math.cos(a), 2.6 * Math.sin(a), { color: 'orange', width: 1.8, dash: [7, 5] }); }
          if (m === 'rot') { const pts = []; for (let k = 0; k <= 40; k++) pts.push([0.35 * Math.cos((th * k) / 40), 0.35 * Math.sin((th * k) / 40)]); S.path(pts, { color: 'orange', width: 2 }); S.text(`${pn(th * DEG, 0)}°`, 0.5 * Math.cos(th / 2), 0.5 * Math.sin(th / 2), { color: 'orange', align: 'center', size: 12 }); }
          S.arrow(0, 0, c1[0], c1[1], { color: 'teal', width: 2.4 });
          S.arrow(0, 0, c2[0], c2[1], { color: 'pink', width: 2.4 });
          if (m !== 'any') S.tex('Se_2', c2[0], c2[1], { color: 'pink', dx: 14, dy: -10, size: 14 });
          S.corner(!uni ? 'not unitary: lengths change' : det > 0 ? `rotation by ${pn(th * DEG, 0)}°: det S = 1` : `reflection across the line at ${pn(((th / 2) * DEG + 180) % 180, 1)}°: det S = −1`, 'tl', { color: uni ? 'green' : 'red', weight: 700 });
          st = { Sm, StS, dev, uni, det };
        });
        v.legend([['accent', 'the letter F and its image'], ['green', 'image of the unit circle'], ['orange', 'mirror line / rotation angle']]);
        v.readout(() => st && `$S = ${mtex(st.Sm, 3)},\\quad S^*S = ${mtex(st.StS, 3)},\\quad \\det S = ${tn(st.det, 3)}$` + (st.uni ? ` — $\\|Sv\\| = \\|v\\|$ for all $v$ and $S$ is invertible ($S^{-1} = S^*$): **unitary**.` : ` — $\\|S^*S - I\\| = ${tn(st.dev, 3)} \\ne 0$, so some lengths change: not an isometry, not unitary.`));
      },
    },
    // ------------------------------------------------------------------ 7.53
    {
      num: '7.53',
      kind: 'Theorem',
      name: 'Characterizations of unitary operators',
      statement: String.raw`Suppose $S \in \mathcal L(V)$ and $e_1, \dots, e_n$ is an orthonormal basis of $V$. Then the following are equivalent:
(a) $S$ is a unitary operator;
(b) $S^*S = SS^* = I$;
(c) $S$ is invertible and $S^{-1} = S^*$;
(d) $Se_1, \dots, Se_n$ is an orthonormal basis of $V$;
(e) the rows of $\mathcal M\big(S, (e_1, \dots, e_n)\big)$ form an orthonormal basis of $\mathbf F^n$ (Euclidean inner product);
(f) $S^*$ is a unitary operator.`,
      idea: String.raw`(a)⇒(b): $S^*S = I$ by 7.49; multiplying by $S^{-1}$ on the right gives $S^* = S^{-1}$, hence also $SS^* = I$. (b)⇒(c) is the definition of an inverse. (c)⇒(d): $S^*S = I$ makes $Se_1, \dots, Se_n$ orthonormal (7.49), and an orthonormal list of length $\dim V$ is a basis (6.28). (d)⇒(e): $S$ is then unitary, so $(S^*)^*S^* = SS^* = I$ and $S^*$ is an isometry; the columns of $\mathcal M(S^*)$, which are the conjugates of the rows of $\mathcal M(S)$, are orthonormal. (e)⇒(f) by 7.49 again, and (f)⇒(a) by applying the chain to $S^*$.`,
      caption: String.raw`Three angle sliders build a rotation of $\mathbf R^3$; the toggle composes it with a reflection. Left: the columns $Se_1, Se_2, Se_3$ (solid) and the rows $r_1, r_2, r_3$ (dashed purple) — both orthonormal frames — and the image of the unit cube. Right: $S^*S$, $SS^*$, $S^{-1}$ and $S^*$, framed in green when $S^*S = SS^* = I$ and $S^{-1} = S^*$. Raise the perturbation $\varepsilon$, which adds $\varepsilon E$ for a fixed matrix $E$: every one of the six conditions fails at the same moment.`,
      deps: ['ladr-7.51', 'ladr-7.49', 'ladr-6.28'],
      tags: ['isometries'],
      viz(v) {
        const M = v.M;
        const YA = v.slider('$\\alpha$ (about $z$)', -180, 180, 35, { step: 1 });
        const PI = v.slider('$\\beta$ (about $y$)', -90, 90, 25, { step: 1 });
        const RO = v.slider('$\\gamma$ (about $x$)', -180, 180, -20, { step: 1 });
        const EP = v.slider('perturbation $\\varepsilon$', 0, 0.5, 0, { step: 0.01 });
        const RF = v.toggle('compose with a reflection', false);
        const E = [[0.3, -0.5, 0.2], [0.6, 0.1, -0.4], [-0.2, 0.5, 0.3]];
        const S = v.stage({ x: [-1.6, 1.6], y: [-1.5, 1.5], equal: true, axes: false, height: 390, weight: 1.1, title: 'columns (solid) and rows (dashed) of $S$' });
        const sc = v.scene3(S, { yaw: -0.65, pitch: 0.3, axis: 1.3 });
        const B = v.stage({ x: [0, 2.3], y: [0, 2.3], equal: true, axes: false, height: 390, weight: 0.95 });
        let st = null;
        v.render(() => {
          const a = YA.value / DEG, b = PI.value / DEG, g = RO.value / DEG, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cg = Math.cos(g), sg = Math.sin(g);
          let Q = mm(mm([[ca, -sa, 0], [sa, ca, 0], [0, 0, 1]], [[cb, 0, sb], [0, 1, 0], [-sb, 0, cb]]), [[1, 0, 0], [0, cg, -sg], [0, sg, cg]]);
          if (RF.value) Q = mm(Q, [[1, 0, 0], [0, 1, 0], [0, 0, -1]]);
          const Sm = Q.map((r, i) => r.map((x, j) => x + EP.value * E[i][j])), St = tr(Sm), Si = M.inverse(Sm);
          const StS = mm(St, Sm), SSt = mm(Sm, St), d1 = fro(msub(StS, eye(3))), d2 = fro(msub(SSt, eye(3))), d3 = Si ? fro(msub(Si, St)) : Infinity;
          const uni = d1 < 1e-9, cols = [0, 1, 2].map((j) => Sm.map((r) => r[j])), rows = Sm, det = M.det(Sm), sv = M.svd(Sm).S, ndev = Math.max(Math.abs(sv[0] - 1), Math.abs(sv[2] - 1));
          sc.begin();
          sphere(S, sc);
          const [c1, c2, c3] = cols, O = ZERO3, ab = add(c1, c2), ac = add(c1, c3), bc = add(c2, c3), abc = add(ab, c3);
          for (const f of [[O, c1, ab, c2], [c3, ac, abc, bc], [O, c1, ac, c3], [c2, ab, abc, bc], [O, c2, bc, c3], [c1, ab, abc, ac]]) sc.poly(f, { fill: 'accent', fillAlpha: 0.05, color: 'accent', alpha: 0.25, width: 1 });
          ['teal', 'pink', 'gold'].forEach((c, j) => { sc.arrow(O, cols[j], { color: c }); sc.tex(`Se_${j + 1}`, cols[j], { color: c, dx: 16, dy: -8, size: 14 }); });
          rows.forEach((r, i) => { sc.arrow(O, r, { color: 'purple', width: 1.8, dash: [5, 4] }); sc.tex(`r_${i + 1}`, r, { color: 'purple', dx: -14, dy: 12, size: 13 }); });
          sc.flush();
          S.corner(uni ? `unitary, det S = ${pn(det, 0)}` : 'not unitary', 'tl', { color: uni ? 'green' : 'red', weight: 700 });
          const w = 0.95, tiles = [[StS, 0.1, 1.22, 'S^*S', d1 < 1e-9], [SSt, 1.25, 1.22, 'SS^*', d2 < 1e-9], [Si || [[0, 0, 0], [0, 0, 0], [0, 0, 0]], 0.1, 0.07, 'S^{-1}', d3 < 1e-9], [St, 1.25, 0.07, 'S^*', d3 < 1e-9]];
          for (const [Mt, x0, y0, lab, ok] of tiles) { drawTile(B, Mt, x0, y0, w, { frame: ok ? 'green' : 'red' }); B.tex(lab, x0 + w / 2, y0 + w + 0.06, { size: 14, color: ok ? 'green' : 'red' }); }
          st = { d1, d2, d3, uni, cols, rows, det, ndev };
        });
        v.readout(() => {
          if (!st) return '';
          const gram = (vs) => fro(msub(vs.map((x) => vs.map((y) => dot(x, y))), eye(3))), t = 1e-9, gc = gram(st.cols), gr = gram(st.rows);
          return `${st.uni ? 'All six conditions hold' : 'All six conditions fail'}:
(a) $\\max_{\\|v\\| = 1}\\big|\\|Sv\\| - 1\\big| = ${tn(st.ndev, 3)}$ ${mark(st.ndev < t)}
(b) $\\|S^*S - I\\| = ${tn(st.d1, 3)},\\ \\|SS^* - I\\| = ${tn(st.d2, 3)}$ ${mark(st.d1 < t && st.d2 < t)}
(c) $\\|S^{-1} - S^*\\| = ${tn(st.d3, 3)}$ ${mark(st.d3 < t)}
(d) columns: $\\|(\\langle Se_j, Se_k\\rangle) - I\\| = ${tn(gc, 3)}$ ${mark(gc < t)}
(e) rows: $\\|(\\langle r_j, r_k\\rangle) - I\\| = ${tn(gr, 3)}$ ${mark(gr < t)}
(f) $S^*$: $\\|(S^*)^*S^* - I\\| = \\|SS^* - I\\| = ${tn(st.d2, 3)}$ ${mark(st.d2 < t)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.54
    {
      num: '7.54',
      kind: 'Theorem',
      name: 'Eigenvalues of unitary operators have absolute value 1',
      statement: String.raw`Suppose $\lambda$ is an eigenvalue of a unitary operator. Then $|\lambda| = 1$.`,
      idea: String.raw`If $Sv = \lambda v$ with $v \ne 0$, then $|\lambda|\,\|v\| = \|\lambda v\| = \|Sv\| = \|v\|$, so $|\lambda| = 1$. More generally, for any operator $\|Sv\|/\|v\|$ lies between the smallest and largest singular values, so every eigenvalue lies in the annulus $\sigma_{\min} \le |\lambda| \le \sigma_{\max}$; for a unitary operator both are $1$ and the annulus is the unit circle.`,
      caption: String.raw`A random $n\times n$ orthogonal (real unitary) matrix or a permutation matrix $S$; its eigenvalues in $\mathbf C$ (computed numerically) all land on the unit circle — for a permutation, on roots of unity. Raise $\varepsilon$ to add a random perturbation: the orange annulus $\sigma_{\min} \le |z| \le \sigma_{\max}$ opens up and the eigenvalues spread inside it. Right: the moduli $|\lambda_k|$ against the band $[\sigma_{\min}, \sigma_{\max}]$. Resample for a new matrix.`,
      deps: ['ladr-7.51', 'ladr-5.5', 'ladr-6.9'],
      tags: ['isometries', 'eigenvalues'],
      viz(v) {
        const M = v.M;
        let seed = 7;
        const kind = v.select('$S$', [{ value: 'orth', label: 'random orthogonal' }, { value: 'perm', label: 'permutation' }], 'orth');
        const N = v.slider('$n$', 2, 10, 7, { int: true });
        const EP = v.slider('perturbation $\\varepsilon$', 0, 0.4, 0, { step: 0.01 });
        v.button('resample', () => { seed++; });
        const Z = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 370, weight: 1.15, title: 'eigenvalues of $S$ in $\\mathbf C$' });
        const Bs = v.stage({ x: [0.4, 10.6], y: [0, 1.8], height: 370, axes: 'box', xlabel: 'k', title: '$|\\lambda_k|$ and the band $[\\sigma_{\\min}, \\sigma_{\\max}]$' });
        let st = null;
        v.render(() => {
          const n = N.value, r = v.rng(seed * 101 + n), ep = EP.value;
          let Q;
          if (kind.value === 'orth') Q = M.qr(Array.from({ length: n }, () => Array.from({ length: n }, () => r.normal()))).Q;
          else { const p = r.shuffle(Array.from({ length: n }, (_, i) => i)); Q = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(p[j] === i))); }
          const r2 = v.rng(seed * 977 + n), Ept = Array.from({ length: n }, () => Array.from({ length: n }, () => r2.normal() / Math.sqrt(n)));
          const Sm = Q.map((row, i) => row.map((x, j) => x + ep * Ept[i][j]));
          const e = M.eig(Sm), sv = M.svd(Sm).S, smax = sv[0], smin = sv[sv.length - 1];
          const R = Math.max(1.5, 1.12 * smax); Z.setView([-R, R], [-R, R]);
          const circ = (rad) => Array.from({ length: 121 }, (_, k) => [rad * Math.cos((TAU * k) / 120), rad * Math.sin((TAU * k) / 120)]);
          if (smax - smin > 1e-6) Z.rings([circ(smax), circ(smin).reverse()], { fill: 'orange', fillAlpha: 0.16, stroke: false });
          Z.circle(0, 0, smax, { color: 'orange', width: 1, alpha: 0.7 });
          Z.circle(0, 0, smin, { color: 'orange', width: 1, alpha: 0.7 });
          Z.circle(0, 0, 1, { color: 'green', width: 2 });
          const mods = e.values.map((z) => z.abs()), dev = Math.max(...mods.map((m) => Math.abs(m - 1)));
          e.values.forEach((z) => Z.dot(z.re, z.im, { r: 5.5, color: Math.abs(z.abs() - 1) < 1e-9 ? 'green' : 'red' }));
          Z.corner(dev < 1e-9 ? 'all |λ| = 1' : `max ||λ| − 1| = ${pn(dev, 3)}`, 'tl', { color: dev < 1e-9 ? 'green' : 'red', weight: 700 });
          Bs.setView([0.4, n + 0.6], [0, Math.max(1.6, 1.12 * smax)]);
          if (smax - smin > 1e-6) Bs.hband(smin, smax, { color: 'orange', alpha: 0.16, edges: true });
          Bs.bars(mods, { x0: 1, dx: 1, color: (m) => (Math.abs(m - 1) < 1e-9 ? 'green' : 'red'), fillAlpha: 0.6 });
          Bs.hline(1, { color: 'green', width: 1.6 });
          // the proof, for the eigenvalue of largest modulus: |λ|·‖v‖ = ‖Sv‖
          const cv = e.cvectors[0];
          let pr = null;
          if (cv) { const nv = Math.hypot(...cv.re, ...cv.im), Sre = Sm.map((row) => dot(row, cv.re)), Sim = Sm.map((row) => dot(row, cv.im)); pr = { lam: e.values[0], ratio: Math.hypot(...Sre, ...Sim) / nv }; }
          st = { dev, smin, smax, d: fro(msub(mm(tr(Sm), Sm), eye(n))), pr, ep };
        });
        v.legend([['green', 'unit circle / $|\\lambda| = 1$'], ['red', '$|\\lambda| \\ne 1$', { dot: true }], ['orange', 'annulus $\\sigma_{\\min} \\le |z| \\le \\sigma_{\\max}$']]);
        v.readout(() => st && `$\\|S^*S - I\\| = ${tn(st.d, 3)},\\quad \\sigma_{\\min} = ${tn(st.smin, 3)},\\ \\sigma_{\\max} = ${tn(st.smax, 3)},\\quad \\max_k \\big||\\lambda_k| - 1\\big| = ${tn(st.dev, 3)}$` + (st.pr ? `. For $\\lambda_1 = ${ctn([st.pr.lam.re, st.pr.lam.im], 3)}$ and its eigenvector $v$: $\\|Sv\\|/\\|v\\| = ${tn(st.pr.ratio, 4)} = |\\lambda_1|$${st.d < 1e-9 ? ', and $\\|Sv\\| = \\|v\\|$ because $S$ is an isometry, so $|\\lambda_1| = 1$.' : '; without $S^*S = I$ this ratio need not be $1$.'}` : ''));
      },
    },
    // ------------------------------------------------------------------ 7.55
    {
      num: '7.55',
      kind: 'Theorem',
      name: 'Unitary operators on complex inner product spaces',
      statement: String.raw`Suppose $\mathbf F = \mathbf C$ and $S \in \mathcal L(V)$. Then the following are equivalent:
(a) $S$ is a unitary operator;
(b) there is an orthonormal basis of $V$ consisting of eigenvectors of $S$ whose corresponding eigenvalues all have absolute value $1$.`,
      idea: String.raw`(a)⇒(b): $S^*S = SS^* = I$ (7.53), so $S$ is normal and the complex spectral theorem (7.31) gives an orthonormal eigenbasis; its eigenvalues have absolute value $1$ by 7.54. (b)⇒(a): if $Se_k = \lambda_ke_k$ with $|\lambda_k| = 1$, then $\langle Se_j, Se_k\rangle = \lambda_j\overline{\lambda_k}\langle e_j, e_k\rangle$ is $1$ for $j = k$ and $0$ otherwise, so $S$ maps an orthonormal basis to an orthonormal basis and is unitary (7.53). So a unitary operator does nothing but turn each coordinate along an orthonormal basis by its own angle.`,
      caption: String.raw`Drag the eigenvalues $\mu_1, \mu_2$ around the unit circle and tilt the orthonormal eigenbasis $e_1, e_2$ of $\mathbf C^2$; this defines $S = \mu_1 P_{e_1} + \mu_2 P_{e_2}$. The animation applies $S$ over and over to a fixed vector $v$ (gold dots: whole steps $S^kv$). Top clocks: the coordinates $\langle S^kv, e_j\rangle$ just turn, each by $\arg\mu_j$ per step, at constant length. Bottom clocks: the standard coordinates of $S^kv$ wander, but the bars show that $|z_1|^2 + |z_2|^2$ never changes. *Random unitary* draws a unitary matrix, computes its eigenvectors and eigenvalues, and rebuilds it from them. Turn on the toggle to pull the $\mu_j$ off the circle: the clocks spiral and the norm drifts.`,
      deps: ['ladr-7.53', 'ladr-7.31', 'ladr-7.54'],
      tags: ['isometries', 'spectral theorem'],
      viz(v) {
        let alpha = 35 / DEG, beta = 0.7, W = null;
        const BR = v.toggle('let $|\\mu_j| \\ne 1$', false, {
          onChange: (on) => { W = null; if (on) m1.set(1.1 * m1.x, 1.1 * m1.y); else for (const h of [m1, m2]) { const t = Math.atan2(h.y, h.x); h.set(Math.cos(t), Math.sin(t)); } },
        });
        const AL = v.slider('basis tilt $\\alpha$ (°)', 0, 90, 35, { step: 1, onChange: (x) => { alpha = x / DEG; W = null; } });
        v.button('random unitary', () => {
          const g = () => [Math.random() * 2 - 1, Math.random() * 2 - 1];
          let a = [g(), g()], b = [g(), g()];
          a = a.map((z) => cscale(z, 1 / cnorm(a)));
          const p = cip(b, a); b = b.map((z, k) => csub(z, cmul(p, a[k]))); b = b.map((z) => cscale(z, 1 / cnorm(b)));
          const Wm = [[a[0], b[0]], [a[1], b[1]]], E = ceig2(Wm), u = E.u[0];
          if (!u) return;
          const ph = cscale(cconj(u[0]), 1 / (cabs(u[0]) || 1)), u0 = cabs(u[0]) > 1e-12 ? [cmul(u[0], ph), cmul(u[1], ph)] : [[0, 0], u[1]];
          alpha = Math.atan2(cabs(u0[1]), u0[0][0]); beta = Math.atan2(u0[1][1], u0[1][0]);
          AL.value = alpha * DEG; BR.set(false);
          m1.set(E.l[0][0], E.l[0][1]); m2.set(E.l[1][0], E.l[1][1]);
          W = Wm;
        });
        const Z = v.stage({ x: [-1.45, 1.45], y: [-1.45, 1.45], equal: true, height: 360, weight: 0.85, title: 'eigenvalues $\\mu_1, \\mu_2$' });
        const onC = (x, y) => { const t = Math.atan2(y, x), r = BR.value ? clamp(Math.hypot(x, y), 0.8, 1.2) : 1; return [r * Math.cos(t), r * Math.sin(t)]; };
        const m1 = Z.handle(Math.cos(0.45), Math.sin(0.45), { color: 'accent', label: 'μ₁', constrain: onC, onDrag: () => { W = null; } });
        const m2 = Z.handle(Math.cos(-1.25), Math.sin(-1.25), { color: 'orange', label: 'μ₂', constrain: onC, onDrag: () => { W = null; } });
        const C = v.stage({ x: [0, 5.2], y: [-2.45, 2.45], equal: true, axes: false, height: 360, weight: 1.6 });
        const c0 = [[0.8, 0], cscale(cexpi(0.9), 0.6)];
        const RC = 0.85, centers = [[0.95, 1.2], [2.95, 1.2], [0.95, -1.2], [2.95, -1.2]];
        const clock = (k, val, trail, col, lab) => {
          const [cx, cy] = centers[k];
          C.circle(cx, cy, RC, { color: 'muted', width: 1, fill: 'accent', fillAlpha: 0.03 });
          C.line(cx - RC, cy, cx + RC, cy, { color: 'faint', width: 1 }); C.line(cx, cy - RC, cx, cy + RC, { color: 'faint', width: 1 });
          C.dots(trail.map((z) => { const m = cabs(z), s = m > 1.05 ? 1.05 / m : 1; return [cx + RC * z[0] * s, cy + RC * z[1] * s]; }), { r: 2.4, color: 'gold', alpha: 0.75 });
          const m = cabs(val), s = m > 1.05 ? 1.05 / m : 1;
          C.arrow(cx, cy, cx + RC * val[0] * s, cy + RC * val[1] * s, { color: col, width: 2.6 });
          C.tex(lab, cx, cy - RC - 0.17, { color: col, size: 13 });
        };
        let st = null;
        v.animate((t) => {
          const mu = [[m1.x, m1.y], [m2.x, m2.y]], e1 = [[Math.cos(alpha), 0], cscale(cexpi(beta), Math.sin(alpha))], e2 = [cscale(cexpi(-beta), -Math.sin(alpha)), [Math.cos(alpha), 0]];
          const U = [[e1[0], e2[0]], [e1[1], e2[1]]], Sm = cmm(cmm(U, [[mu[0], [0, 0]], [[0, 0], mu[1]]]), cadj(U));
          const uni = cfro(cmsub(cmm(cadj(Sm), Sm), cI2)) < 1e-9;
          const pw = (z, k) => cscale(cexpi(k * Math.atan2(z[1], z[0])), cabs(z) ** k);
          const kk = 0.9 * t, cAt = (k) => [cmul(pw(mu[0], k), c0[0]), cmul(pw(mu[1], k), c0[1])], zAt = (k) => cmv(U, cAt(k));
          const n0 = Math.max(0, Math.floor(kk) - 24), trail = []; for (let j = n0; j <= Math.floor(kk); j++) trail.push(j);
          const c = cAt(kk), z = zAt(kk);
          // eigenvalue plane
          Z.circle(0, 0, 1, { color: 'green', width: 2, alpha: 0.8 });
          for (const [i, h] of [[0, m1], [1, m2]]) { const a = Math.atan2(h.y, h.x), pts = []; for (let j = 0; j <= 30; j++) pts.push([0.32 * Math.cos((a * j) / 30), 0.32 * Math.sin((a * j) / 30)]); Z.path(pts, { color: i ? 'orange' : 'accent', width: 2 }); Z.line(0, 0, h.x, h.y, { color: i ? 'orange' : 'accent', width: 1, alpha: 0.5 }); }
          Z.corner(uni ? `S is unitary, |μ₁| = |μ₂| = 1` : `|μ₁| = ${pn(Math.hypot(m1.x, m1.y))}, |μ₂| = ${pn(Math.hypot(m2.x, m2.y))}: not unitary`, 'tl', { color: uni ? 'green' : 'red', weight: 700 });
          Z.corner(`k = ${pn(kk, 1)} steps`, 'bl', { color: 'muted' });
          // clocks
          C.tex('\\text{coordinates along } e_1, e_2', 1.95, 2.33, { size: 13, color: 'ink' });
          C.tex('\\text{standard coordinates}', 1.95, 0.02, { size: 13, color: 'ink' });
          clock(0, c[0], trail.map((j) => cAt(j)[0]), 'accent', '\\langle S^kv, e_1\\rangle');
          clock(1, c[1], trail.map((j) => cAt(j)[1]), 'orange', '\\langle S^kv, e_2\\rangle');
          clock(2, z[0], trail.map((j) => zAt(j)[0]), 'teal', 'z_1');
          clock(3, z[1], trail.map((j) => zAt(j)[1]), 'pink', 'z_2');
          const bar = (y0, p1, p2, c1, c2, lab) => {
            const H = 1.6, x0 = 4.3, x1 = 4.75, top = y0 + H * (p1 + p2), lim = y0 + 2.05;
            C.rect(x0, y0, x1, Math.min(lim, y0 + H * p1), { fill: c1, fillAlpha: 0.6, stroke: false });
            if (y0 + H * p1 < lim) C.rect(x0, y0 + H * p1, x1, Math.min(lim, top), { fill: c2, fillAlpha: 0.6, stroke: false });
            C.line(x0 - 0.12, y0 + H, x1 + 0.12, y0 + H, { color: 'green', width: 2, dash: [4, 3] });
            C.text(pn(p1 + p2, 3), (x0 + x1) / 2, Math.min(lim, top) + 0.13, { align: 'center', size: 11.5, color: Math.abs(p1 + p2 - 1) < 1e-9 ? 'green' : 'red' });
            C.tex(lab, (x0 + x1) / 2, y0 - 0.2, { size: 12 });
          };
          bar(0.2, cabs(c[0]) ** 2, cabs(c[1]) ** 2, 'accent', 'orange', '\\|S^kv\\|^2');
          bar(-2.2, cabs(z[0]) ** 2, cabs(z[1]) ** 2, 'teal', 'pink', '\\|S^kv\\|^2');
          st = { Sm, uni, nrm: cnorm(z) ** 2, ip: cabs(cip(e1, e2)), Wd: W ? cfro(cmsub(Sm, W)) : null, mu };
        }, { period: 40 });
        v.readout(() => st && `$S = ${cmtex(st.Sm, 3)},\\quad \\langle e_1, e_2\\rangle = ${tn(st.ip, 3)},\\quad \\|S^kv\\|^2 = ${tn(st.nrm, 4)}$` + (st.uni ? ' — eigenvalues on the unit circle along an orthonormal basis: $S$ is unitary, and $\\|S^kv\\| = \\|v\\|$ at every step.' : ' — an eigenvalue off the unit circle: $S$ still has an orthonormal eigenbasis (it is normal) but is not unitary, and $\\|S^kv\\|$ drifts.') + (st.Wd !== null ? ` Rebuilt from the computed eigen-data of the random unitary $W$: $\\|S - W\\| = ${tn(st.Wd, 4)}$.` : ''));
      },
    },
  ],
};
