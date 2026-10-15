// Linear Algebra Done Right (Axler, 4th ed.) — Chapter 9: Multilinear Algebra and Determinants
// Part 2 (this file): 9.14–9.25 — alternating bilinear forms, the splitting V⁽²⁾ = V⁽²⁾sym ⊕ V⁽²⁾alt, quadratic forms,
// their characterizations and diagonalization, and multilinear forms. Part 1 (9.1–9.13, with the chapter title and
// summary) is ch09.js; 9.27 onwards live in later part files.

// =====================================================================================================
// Shared helpers
// =====================================================================================================
const TAU = 2 * Math.PI;
const DEG = 180 / Math.PI;

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
const mark = (ok) => (ok ? '✓' : '✗');
/** "+ b" or "- |b|" in TeX. */
const plus = (b, d = 2) => (b < 0 ? `- ${tn(-b, d)}` : `+ ${tn(b, d)}`);
/** a, snapped onto b when they agree to rounding error (so that equal quantities print equal). */
const same = (a, b) => (Math.abs(a - b) <= 1e-9 * (1 + Math.abs(b)) ? b : a);
/** Polynomial a x₁² + b x₁x₂ + c x₂² as TeX. */
function polyTex(a, b, c, d = 2) {
  const t = [[a, 'x_1^2'], [b, 'x_1x_2'], [c, 'x_2^2']].filter(([k]) => Math.abs(k) > 0.5 * 10 ** -d);
  if (!t.length) return '0';
  return t.map(([k, m], i) => { const s = tn(Math.abs(k), d), co = s === '1' ? '' : s; return (i ? (k < 0 ? ' - ' : ' + ') : k < 0 ? '-' : '') + co + m; }).join('');
}

// ---------- real vectors and matrices (matrices are arrays of rows) ----------
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const add = (a, b) => a.map((x, i) => x + b[i]);
const sub = (a, b) => a.map((x, i) => x - b[i]);
const scl = (a, k) => a.map((x) => x * k);
const len = (a) => Math.hypot(...a);
const unit = (a) => { const l = len(a); return l > 1e-12 ? scl(a, 1 / l) : a.map(() => 0); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const mv = (A, x) => A.map((r) => dot(r, x));
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
const tp = (A) => A[0].map((_, j) => A.map((r) => r[j]));
const madd = (A, B) => A.map((r, i) => r.map((x, j) => x + B[i][j]));
const msub = (A, B) => A.map((r, i) => r.map((x, j) => x - B[i][j]));
const mscl = (A, k) => A.map((r) => r.map((x) => x * k));
const fro = (A) => Math.sqrt(A.flat().reduce((s, x) => s + x * x, 0));
const maxAbs = (A) => Math.max(0, ...A.flat().map(Math.abs));
const fromCols = (cs) => cs[0].map((_, i) => cs.map((c) => c[i]));
const det2 = (a, b) => a[0] * b[1] - a[1] * b[0];
const det3 = (a, b, c) => dot(a, cross(b, c));
function inv2(A) { const [[a, b], [c, d]] = A, D = a * d - b * c; return [[d / D, -b / D], [-c / D, a / D]]; }
const rot90 = (p) => [-p[1], p[0]];
/** β(u, w) = uᵗ A w. */
const bil = (A, u, w) => dot(u, mv(A, w));
const symPart = (A) => A.map((r, i) => r.map((x, j) => (x + A[j][i]) / 2));
const skewPart = (A) => A.map((r, i) => r.map((x, j) => (x - A[j][i]) / 2));
const gram = (B, E) => E.map((ej) => E.map((ek) => bil(B, ej, ek)));
/** Eigenvalues l[0] ≥ l[1] and unit eigenvectors of a symmetric 2×2 matrix. */
function esym2(A) {
  const a = A[0][0], b = (A[0][1] + A[1][0]) / 2, d = A[1][1], m = (a + d) / 2, r = Math.hypot((a - d) / 2, b);
  const phi = 0.5 * Math.atan2(2 * b, a - d), c = Math.cos(phi), s = Math.sin(phi);
  return { l: [m + r, m - r], phi, u: [[c, s], [-s, c]] };
}
function niceStep(x) { const p = 10 ** Math.floor(Math.log10(x)), m = x / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; }
function signature(ls, tol = 1e-9) { let p = 0, m = 0, z = 0; for (const l of ls) { if (l > tol) p++; else if (l < -tol) m++; else z++; } return [p, m, z]; }
const sgnCh = (x, tol = 1e-9) => (x > tol ? '+' : x < -tol ? '-' : '0');

// ---------- drawing ----------
const disc = (r) => (x, y) => { const l = Math.hypot(x, y); return l > r ? [(x * r) / l, (y * r) / l] : [x, y]; };
function tip(S, tex, p, color, { off = 15, size = 15 } = {}) {
  const r = Math.hypot(p[0], p[1]) || 1;
  S.tex(tex, p[0], p[1], { color, size, dx: (off * p[0]) / r, dy: (-off * p[1]) / r });
}
/** Points of {x ∈ R² : xᵗAx = c} sampled by angle (null where there is no point or it lies beyond R). */
function conic(A, c, R = 8, n = 540) {
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const t = (TAU * k) / n, u = [Math.cos(t), Math.sin(t)], Q = bil(A, u, u), r2 = c / Q;
    pts.push(Math.abs(Q) > 1e-12 && r2 > 0 && r2 < R * R ? scl(u, Math.sqrt(r2)) : null);
  }
  return pts;
}
/** Shade a stage by the sign and size of f (blue > 0, red < 0), cached by key. */
function signHeat(v, S, f, key, scale = 1, a = 0.42) {
  const P = v.rgb('blue'), N = v.rgb('red'), BG = v.rgb('panel');
  S.raster((x, y) => {
    const z = f(x, y); if (!isFinite(z)) return null;
    const C = z >= 0 ? P : N, k = Math.min(1, Math.abs(z) / scale) * a;
    return [BG[0] + (C[0] - BG[0]) * k, BG[1] + (C[1] - BG[1]) * k, BG[2] + (C[2] - BG[2]) * k];
  }, { key: `${key}|${BG.join(',')}`, res: 3 });
}
function skewGrid(S, e1, e2, st = {}) {
  const K = st.K ?? 8;
  S.clip(() => {
    for (let k = -K; k <= K; k++) {
      S.line(k * e1[0] - 9 * e2[0], k * e1[1] - 9 * e2[1], k * e1[0] + 9 * e2[0], k * e1[1] + 9 * e2[1], { color: st.c1 || 'teal', width: k ? 0.8 : 1.3, alpha: st.alpha ?? 0.3 });
      S.line(k * e2[0] - 9 * e1[0], k * e2[1] - 9 * e1[1], k * e2[0] + 9 * e1[0], k * e2[1] + 9 * e1[1], { color: st.c2 || 'pink', width: k ? 0.8 : 1.3, alpha: st.alpha ?? 0.3 });
    }
  });
}
/** A small matrix with brackets at pixel (X, Y) (top-left); returns its box with a hit-test in pixels. */
function matPx(v, S, A, X, Y, o = {}) {
  const rows = A.length, cols = A[0].length, cw = o.cw ?? 44, ch = o.ch ?? 28, W = cols * cw, H = rows * ch, c = S.ctx;
  c.save();
  if (o.fill) for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const f = o.fill(i, j); if (f) { c.fillStyle = v.color(f[0], f[1] ?? 0.2); c.fillRect(X + j * cw + 1, Y + i * ch + 1, cw - 2, ch - 2); } }
  for (const [i, j, col] of o.cells || []) { c.strokeStyle = v.color(col || 'gold'); c.lineWidth = 2.2; c.strokeRect(X + j * cw + 2, Y + i * ch + 2, cw - 4, ch - 4); }
  c.strokeStyle = v.color(o.frame || 'ink'); c.lineWidth = o.frameW ?? 1.5; c.beginPath();
  c.moveTo(X + 5, Y - 2); c.lineTo(X, Y - 2); c.lineTo(X, Y + H + 2); c.lineTo(X + 5, Y + H + 2);
  c.moveTo(X + W - 5, Y - 2); c.lineTo(X + W, Y - 2); c.lineTo(X + W, Y + H + 2); c.lineTo(X + W - 5, Y + H + 2);
  c.stroke(); c.restore();
  const size = o.size ?? Math.min(15, ch * 0.5, cw * 0.36);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    S.textPx(pn(A[i][j], o.d ?? 2), X + (j + 0.5) * cw, Y + (i + 0.5) * ch + 0.5, { align: 'center', size, color: o.color ? o.color(i, j) : 'ink', halo: false });
  }
  if (o.label) S.texPx(o.label, X + W / 2, Y - 14, { color: o.labelColor || 'ink', size: o.labelSize ?? 14, baseline: 'bottom' });
  return { X, Y, W, H, cw, ch, rows, cols, hit(px, py) { const j = Math.floor((px - X) / cw), i = Math.floor((py - Y) / ch); return i >= 0 && i < rows && j >= 0 && j < cols ? [i, j] : null; } };
}
/** Small curved arrow at the origin, from the direction of u to the direction of w (the orientation of the pair). */
function orientArc(S, u, w, r, color) {
  const a0 = Math.atan2(u[1], u[0]); let d = Math.atan2(w[1], w[0]) - a0;
  while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
  const pts = []; for (let k = 0; k <= 30; k++) { const t = a0 + (d * k) / 30; pts.push([r * Math.cos(t), r * Math.sin(t)]); }
  S.path(pts, { color, width: 2 });
  const t1 = a0 + d, t0 = a0 + d * 0.86;
  S.arrow(r * Math.cos(t0), r * Math.sin(t0), r * Math.cos(t1), r * Math.sin(t1), { color, width: 2, head: 8 });
}
/** Signed-log compression used for axes that must show signs honestly over a wide range. */
const slog = (x) => Math.sign(x) * Math.log1p(Math.abs(x));

export default {
  collection: 'ladr',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.14
    {
      num: '9.14',
      kind: 'Definition',
      name: 'Alternating bilinear form',
      statement: String.raw`A bilinear form $\alpha \in V^{(2)}$ is called **alternating** if
$$\alpha(v, v) = 0 \qquad\text{for all } v \in V.$$
The set of alternating bilinear forms on $V$ is denoted $V^{(2)}_{\mathrm{alt}}$.`,
      idea: String.raw`The model is the area form on $\mathbf R^2$, $\alpha(u, w) = u_1w_2 - u_2w_1$: the signed area of the parallelogram spanned by $u$ and $w$, positive when $w$ lies counterclockwise from $u$. It vanishes when $u = w$ because the parallelogram collapses. Other examples: $x_1y_2 - x_2y_1 + x_1y_3 - x_3y_1$ on $\mathbf F^3$, and $\varphi(u)\tau(w) - \varphi(w)\tau(u)$ for any $\varphi, \tau \in V'$. On $\mathbf R^2$ there is nothing else: if $\alpha$ is alternating with matrix $A$, then $A_{1,1} = \alpha(e_1, e_1) = 0$, $A_{2,2} = 0$ and $0 = \alpha(e_1 + e_2, e_1 + e_2) = A_{1,2} + A_{2,1}$, so $\alpha$ is a multiple of the area form. Alternating forms in more slots will give the determinant (9.27 onward).`,
      caption: String.raw`Drag $u$ (blue) and $w$ (gold). The parallelogram is shaded blue or red by the sign of $\alpha(u, w)$ and the arrow at the origin shows the orientation of the pair; drag $w$ across the line of $u$ and the sign flips, drag it onto $u$ and everything collapses to $0$. The right panel plots $\alpha(x, x)$ for unit vectors $x$ at every angle: identically zero for an alternating form (the dashed curve, $\alpha(u/\|u\|, x)$, vanishes exactly where $x$ points along $u$). Add a symmetric part $s$ and the diagonal values $\alpha(x, x)$ (and $\alpha(u, u)$, $\alpha(w, w)$ in the readout) stop being zero.`,
      deps: ['ladr-9.1'],
      see: ['mfd-6.6'],
      tags: ['bilinear forms', 'multilinear'],
      viz(v) {
        const S0 = [[1, 0.4], [0.4, -0.5]];
        const cs = v.slider('multiple $c$ of the area form', -2, 2, 1, { step: 0.05 });
        const ss = v.slider('symmetric part $s$', -1.5, 1.5, 0, { step: 0.05 });
        const P = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 380, weight: 1.05 });
        const R = v.stage({ x: [0, Math.PI], y: [-2, 2], axes: 'box', height: 380, weight: 0.95, xticks: [[0, '0'], [Math.PI / 4, 'π/4'], [Math.PI / 2, 'π/2'], [(3 * Math.PI) / 4, '3π/4'], [Math.PI, 'π']], xlabel: 'angle θ of the unit vector x', title: '$\\alpha(x, x)$ for $x = (\\cos\\theta, \\sin\\theta)$' });
        const uh = P.handle(1.4, 0.35, { color: 'accent', label: 'u' });
        const wh = P.handle(0.45, 1.25, { color: 'gold', label: 'w' });
        let st = null;
        v.render(() => {
          const c = cs.value, s = ss.value, A = [[s * S0[0][0], c + s * S0[0][1]], [-c + s * S0[1][0], s * S0[1][1]]];
          const u = [uh.x, uh.y], w = [wh.x, wh.y], a = bil(A, u, w), area = det2(u, w);
          P.poly([[0, 0], u, add(u, w), w], { fill: a >= 0 ? 'blue' : 'red', fillAlpha: 0.06 + Math.min(0.32, 0.12 * Math.abs(a)), color: a >= 0 ? 'blue' : 'red', width: 1.2, alpha: 0.6 });
          if (Math.abs(area) > 0.02) orientArc(P, u, w, 0.38, area > 0 ? 'blue' : 'red');
          P.arrow(0, 0, u[0], u[1], { color: 'accent', width: 2.8 }); P.arrow(0, 0, w[0], w[1], { color: 'gold', width: 2.8 });
          const m = scl(add(u, w), 0.5);
          P.text(`α(u, w) = ${pn(a, 2)}`, m[0], m[1], { align: 'center', size: 13, weight: 700, color: a >= 0 ? 'blue' : 'red' });
          // the diagonal θ ↦ α(x_θ, x_θ)
          const g = (t) => bil(A, [Math.cos(t), Math.sin(t)], [Math.cos(t), Math.sin(t)]);
          R.hline(0, { color: 'muted', width: 1 });
          let mx = 0; for (let k = 0; k <= 180; k++) mx = Math.max(mx, Math.abs(g((Math.PI * k) / 180)));
          const okAlt = mx < 1e-9;
          const ua = Math.atan2(u[1], u[0]), uh1 = [Math.cos(ua), Math.sin(ua)];
          R.fn((t) => bil(A, uh1, [Math.cos(t), Math.sin(t)]), { color: 'accent', width: 1.6, dash: [6, 5] });
          R.between(g, () => 0, 0, Math.PI, { fill: 'red', fillAlpha: 0.15 });
          R.fn(g, { color: okAlt ? 'green' : 'red', width: 3 });
          const ang = (p) => ((Math.atan2(p[1], p[0]) % Math.PI) + Math.PI) % Math.PI;
          R.dot(ang(u), g(ang(u)), { r: 6, color: 'accent', label: 'u/|u|', labelPos: 'n' });
          R.dot(ang(w), g(ang(w)), { r: 6, color: 'gold', label: 'w/|w|', labelPos: 's' });
          R.corner(okAlt ? 'α(x, x) = 0 at every angle: alternating' : `max |α(x, x)| = ${pn(mx, 3)}: not alternating`, 'tl', { color: okAlt ? 'green' : 'red', weight: 700 });
          st = { A, a, area, c, s, auu: bil(A, u, u), aww: bil(A, w, w), mx, okAlt };
        });
        v.legend([['blue', '$\\alpha(u, w) > 0$', { area: true }], ['red', '$\\alpha(u, w) < 0$', { area: true }], ['green', '$\\alpha(x, x)$ (alternating)'], ['red', '$\\alpha(x, x)$ (not alternating)'], ['accent', '$\\alpha(u/\\|u\\|, x)$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const head = `$\\mathcal M(\\alpha) = ${mtex(st.A)}$, $\\ \\alpha(u, w) = ${tn(st.a, 3)}$`;
          if (st.okAlt) return head + ` $= ${tn(st.c, 2)}\\cdot(u_1w_2 - u_2w_1) = ${tn(st.c, 2)} \\cdot ${tn(st.area, 3)}$, the signed area times $c$; $\\ \\alpha(u, u) = ${tn(st.auu, 3)}$, $\\alpha(w, w) = ${tn(st.aww, 3)}$. **Alternating** — and on $\\mathbf R^2$ every alternating form is such a multiple: $\\dim V^{(2)}_{\\mathrm{alt}} = 1$.`;
          return head + `; but $\\alpha(u, u) = ${tn(st.auu, 3)}$, $\\alpha(w, w) = ${tn(st.aww, 3)}$: the diagonal entries of the matrix are no longer $0$, so the form is **not alternating**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.16
    {
      num: '9.16',
      kind: 'Theorem',
      name: 'Characterization of alternating bilinear forms',
      statement: String.raw`A bilinear form $\alpha$ on $V$ is alternating if and only if
$$\alpha(u, w) = -\alpha(w, u) \qquad\text{for all } u, w \in V.$$`,
      idea: String.raw`If $\alpha$ is alternating, expand a vanishing value:
$$0 = \alpha(u + w, u + w) = \alpha(u, u) + \alpha(u, w) + \alpha(w, u) + \alpha(w, w) = \alpha(u, w) + \alpha(w, u).$$
Conversely, if swapping the inputs always flips the sign, take $u = w = v$: then $\alpha(v, v) = -\alpha(v, v)$, so $2\alpha(v, v) = 0$ and $\alpha(v, v) = 0$ (here $2 \ne 0$ in $\mathbf F$ is used).`,
      caption: String.raw`An alternating form on $\mathbf R^3$: $\alpha(u, w) = \langle n, u \times w\rangle = \det(n, u, w)$, the flux of the parallelogram on $u, w$ through the direction $n$ (purple) — it starts as Axler's example $x_1y_2 - x_2y_1 + x_1y_3 - x_3y_1$, with $n = (0, -1, 1)$. Drag $u$, $w$ and $n$ (drag the background to rotate). Swapping $u$ and $w$ reverses the normal $u \times w$ (green), so $\alpha(w, u) = -\alpha(u, w)$. The bars expand $\alpha(u + w, u + w)$ into its four terms: the two diagonal ones are $0$, the total is $0$, so the two cross terms must cancel. Add a symmetric part $s\langle u, w\rangle$: the diagonal bars grow and the cancellation is gone.`,
      deps: ['ladr-9.14'],
      tags: ['bilinear forms', 'multilinear'],
      viz(v) {
        const ss = v.slider('add a symmetric part $s\\,\\langle u, w\\rangle$', -1, 1, 0, { step: 0.05 });
        const S = v.stage({ x: [-2, 2], y: [-1.8, 1.8], equal: true, axes: false, height: 400, weight: 1.15 });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.32, axis: 1.4, lim: 1.4 });
        const R = v.stage({ x: [0.4, 5.95], y: [-2, 2], height: 400, weight: 0.85, minWidth: 260, axes: false, title: 'the four terms of $\\beta(u + w, u + w)$' });
        const uh = sc.handle([1.1, 0.2, 0.1], { color: 'accent', label: 'u' });
        const wh = sc.handle([0.3, 1.0, 0.5], { color: 'gold', label: 'w' });
        const nh = sc.handle([0, -0.9, 0.9], { color: 'purple', label: 'n' });
        let st = null;
        v.render(() => {
          const s = ss.value, n = nh.p, u = uh.p, w = wh.p;
          const f = (a, b) => dot(n, cross(a, b)) + s * dot(a, b);
          const uw = cross(u, w), auw = f(u, w), awu = f(w, u);
          sc.begin();
          // the parallelogram on u, w, coloured by the sign of the alternating part, and the box (n, u, w)
          const al = dot(n, uw);
          const P4 = [[0, 0, 0], u, add(u, w), w];
          sc.poly(P4, { fill: al >= 0 ? 'blue' : 'red', fillAlpha: 0.22, color: al >= 0 ? 'blue' : 'red', alpha: 0.7 });
          for (const p of [[0, 0, 0], u, add(u, w), w]) sc.line(p, add(p, n), { color: 'purple', width: 1, alpha: 0.3, dash: [3, 4] });
          sc.path([n, add(n, u), add(add(n, u), w), add(n, w), n], { color: 'purple', width: 1, alpha: 0.35 });
          const nu = scl(unit(uw), Math.min(1.3, 0.6 + 0.5 * len(uw)));
          if (len(uw) > 1e-6) { sc.arrow([0, 0, 0], nu, { color: 'green', width: 2.2 }); sc.tex('u \\times w', nu, { color: 'green', size: 14, dx: 18, dy: -6 }); }
          sc.arrow([0, 0, 0], n, { color: 'purple', width: 2.6 });
          sc.arrow([0, 0, 0], u, { color: 'accent', width: 3 }); sc.arrow([0, 0, 0], w, { color: 'gold', width: 3 });
          sc.flush();
          // bars
          const T = [f(u, u), auw, awu, f(w, w)], tot = f(add(u, w), add(u, w)), mx = Math.max(1, ...T.map(Math.abs), Math.abs(tot)) * 1.25;
          R.setView([0.4, 5.95], [-mx, mx]);
          R.hline(0, { color: 'muted', width: 1.2 });
          const cols = ['muted', 'accent', 'gold', 'muted', 'green'], labs = ['\\beta(u,u)', '\\beta(u,w)', '\\beta(w,u)', '\\beta(w,w)', '\\beta(u{+}w,u{+}w)'];
          [...T, tot].forEach((t, i) => {
            const x = i + 1 + (i === 4 ? 0.15 : 0);
            if (Math.abs(t) > 1e-9) R.rect(x - 0.32, 0, x + 0.32, t, { fill: cols[i], fillAlpha: 0.55, color: cols[i], width: 1.4 });
            else R.line(x - 0.32, 0, x + 0.32, 0, { color: cols[i], width: 3.5 });
            R.text(pn(t, 2), x, t, { align: 'center', size: 12, weight: 700, color: cols[i] === 'muted' ? 'ink' : cols[i], dy: t >= 0 ? -10 : 12 });
            R.tex(labs[i], x, -mx, { size: i === 4 ? 11.5 : 12.5, color: cols[i] === 'muted' ? 'ink' : cols[i], dy: -14 });
          });
          R.line(4.57, -mx * 0.9, 4.57, mx * 0.9, { color: 'faint', width: 1, dash: [3, 4] });
          R.text('=', 4.57, mx * 0.82, { align: 'center', size: 15, color: 'muted' });
          st = { s, auw, awu, uu: T[0], ww: T[3], tot, al, n };
        });
        v.legend([['accent', '$u$'], ['gold', '$w$'], ['purple', '$n$ (defines $\\alpha$)'], ['green', '$u \\times w$']]);
        v.readout(() => {
          if (!st) return '';
          if (Math.abs(st.s) < 1e-9) return `$\\alpha(u, w) = \\langle n, u \\times w\\rangle = ${tn(st.auw, 3)}$ and $\\alpha(w, u) = ${tn(st.awu, 3)}$: their sum is $${tn(st.auw + st.awu, 3)}$ ${mark(Math.abs(st.auw + st.awu) < 1e-9)}. In the expansion $0 = \\alpha(u + w, u + w) = 0 + \\alpha(u, w) + \\alpha(w, u) + 0$ the cross terms are forced to cancel.`;
          return `With the symmetric part, $\\beta(u, w) = ${tn(st.auw, 3)}$ and $\\beta(w, u) = ${tn(st.awu, 3)}$ no longer cancel: $\\beta(u, w) + \\beta(w, u) = 2s\\langle u, w\\rangle = ${tn(st.auw + st.awu, 3)}$, and indeed $\\beta(u, u) = s\\|u\\|^2 = ${tn(st.uu, 3)} \\ne 0$ — not alternating, and not sign-flipping either.`;
        });
      },
    },

    // ------------------------------------------------------------------ 9.17
    {
      num: '9.17',
      kind: 'Theorem',
      name: 'Bilinear forms = symmetric ⊕ alternating',
      statement: String.raw`The sets $V^{(2)}_{\mathrm{sym}}$ and $V^{(2)}_{\mathrm{alt}}$ are subspaces of $V^{(2)}$, and
$$V^{(2)} = V^{(2)}_{\mathrm{sym}} \oplus V^{(2)}_{\mathrm{alt}}.$$`,
      idea: String.raw`Both sets are closed under addition and scalar multiplication and contain $0$. Every $\beta \in V^{(2)}$ splits as $\beta = \rho + \alpha$ with
$$\rho(u, w) = \tfrac12\big(\beta(u, w) + \beta(w, u)\big), \qquad \alpha(u, w) = \tfrac12\big(\beta(u, w) - \beta(w, u)\big),$$
where $\rho$ is symmetric and $\alpha$ is alternating by 9.16. The sum is direct (1.46) because a form that is both satisfies $\beta(u, w) = -\beta(w, u) = -\beta(u, w)$, hence is $0$. In a basis this is the splitting of a square matrix into its symmetric and skew-symmetric parts, $A = \frac12(A + A^{t}) + \frac12(A - A^{t})$, which is therefore the only one; counting entries, $\dim V^{(2)}_{\mathrm{sym}} = \frac{n(n+1)}2$ and $\dim V^{(2)}_{\mathrm{alt}} = \frac{n(n-1)}2$.`,
      caption: String.raw`Top row: a bilinear form on $\mathbf R^3$ given by its matrix $A$ (Axler's example 9.2 to start; click the top or bottom half of an entry, or drag it, to edit), split into its symmetric part $S$ and skew part $K$ — green frames mean "symmetric" and "skew" respectively. Bottom row: try another split $A = (S + tX) + (K - tX)$ with the slider; cells that break symmetry or skewness are outlined in red, and the right panel plots how far each part is from its type. Only $t = 0$ works — a symmetric $X$ repairs one part and breaks the other, and so does a skew one.`,
      deps: ['ladr-9.16', 'ladr-1.46', 'ladr-9.9', 'ladr-9.14'],
      tags: ['bilinear forms', 'direct sums'],
      viz(v) {
        const A0 = [[0, 1, 0], [0, 0, -5], [2, 0, 0]], A = A0.map((r) => r.slice());
        let seed = 3, X = null;
        const makeX = () => {
          const r = v.rng(seed * 7 + 1);
          for (let tries = 0; tries < 20; tries++) {
            let Y = [0, 1, 2].map(() => [0, 1, 2].map(() => Math.round(r.uniform(-2, 2) * 2) / 2));
            if (kind.value === 'sym') Y = symPart(Y); else if (kind.value === 'skew') Y = skewPart(Y);
            if (fro(Y) > 1) return Y;
          }
          return kind.value === 'skew' ? [[0, 1, 0], [-1, 0, 0], [0, 0, 0]] : [[1, 0, 0], [0, 0, 0], [0, 0, 0]];
        };
        const kind = v.select('direction $X$ of the other split', [{ value: 'any', label: 'random' }, { value: 'sym', label: 'symmetric' }, { value: 'skew', label: 'skew' }], 'any', { onChange: () => { X = makeX(); } });
        const ts = v.slider('$t$', -1, 1, 0.4, { step: 0.01 });
        v.button('new $X$', () => { seed++; X = makeX(); });
        v.button('reset $A$', () => A.forEach((r, i) => r.forEach((_, j) => { r[j] = A0[i][j]; })));
        X = makeX();
        const L = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 410, weight: 1.35, minWidth: 380 });
        const R = v.stage({ x: [-1, 1], y: [0, 5], axes: 'box', height: 410, weight: 0.65, minWidth: 230, xlabel: 't', title: 'distance of each part from its type' });
        let boxA = null, drag = null, st = null;
        L.onDrag((x, y, ph) => {
          const px = L.X(x), py = L.Y(y);
          if (ph === 'start') { const c = boxA && boxA.hit(px, py); drag = c ? { c, Y: py, a: A[c[0]][c[1]], moved: false } : null; return; }
          if (!drag) return;
          const dy = drag.Y - py, [i, j] = drag.c;
          if (ph === 'move' && (drag.moved || Math.abs(dy) > 5)) { drag.moved = true; A[i][j] = Math.max(-9, Math.min(9, drag.a + Math.round(dy / 14))); }
          if (ph === 'end') { if (!drag.moved) A[i][j] = Math.max(-9, Math.min(9, drag.a + (py < boxA.Y + (i + 0.5) * boxA.ch ? 1 : -1))); drag = null; }
        });
        const asym = (M) => fro(msub(M, tp(M))), askew = (M) => fro(madd(M, tp(M)));
        v.render(() => {
          const t = ts.value, Sm = symPart(A), Km = skewPart(A), S2 = madd(Sm, mscl(X, t)), K2 = msub(Km, mscl(X, t));
          const W = L.width, cw = Math.max(30, Math.min(44, (W - 120) / 9)), ch = Math.min(28, cw * 0.72), gap = 30, tot = 9 * cw + 2 * gap, X0 = (W - tot) / 2;
          const mx = Math.max(1, maxAbs(A));
          const heat = (M) => (i, j) => (Math.abs(M[i][j]) > 1e-9 ? [M[i][j] > 0 ? 'blue' : 'red', 0.08 + (0.3 * Math.min(1, Math.abs(M[i][j]) / mx))] : null);
          const bad = (M, sign) => { const c = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (Math.abs(M[i][j] - sign * M[j][i]) > 1e-9) c.push([i, j, 'red']); return c; };
          const row = (Y, Ms, labels, frames, cells) => {
            const boxes = [];
            Ms.forEach((M, k) => {
              const x = X0 + k * (3 * cw + gap);
              boxes.push(matPx(v, L, M, x, Y, { cw, ch, d: 2, fill: heat(M), frame: frames[k], frameW: frames[k] === 'ink' ? 1.5 : 2.4, cells: cells[k], label: labels[k], labelSize: 13 }));
              if (k < 2) L.textPx(k ? '+' : '=', x + 3 * cw + gap / 2, Y + 1.5 * ch, { align: 'center', size: 20, color: 'muted' });
            });
            return boxes;
          };
          const Y1 = 50, Y2 = Y1 + 3 * ch + 86;
          boxA = row(Y1, [A, Sm, Km], ['A', 'S = \\tfrac12(A + A^{t})', 'K = \\tfrac12(A - A^{t})'], ['ink', 'green', 'green'], [[], [], []])[0];
          L.textPx('click or drag an entry of A', X0 + 1.5 * cw, Y1 + 3 * ch + 16, { align: 'center', size: 11, color: 'muted' });
          const okS = asym(S2) < 1e-9, okK = askew(K2) < 1e-9;
          row(Y2, [A, S2, K2], ['A', `S + ${tn(t, 2)}X`, `K - ${tn(t, 2)}X`], ['ink', okS ? 'green' : 'red', okK ? 'green' : 'red'], [[], bad(S2, 1), bad(K2, -1)]);
          L.texPx(`\\|S' - S'^{t}\\| = ${tn(asym(S2), 2)}, \\quad \\|K' + K'^{t}\\| = ${tn(askew(K2), 2)}`, W / 2, Y2 + 3 * ch + 30, { size: 14, color: okS && okK ? 'green' : 'red' });
          // the defects along the family
          const dS = (tt) => asym(madd(Sm, mscl(X, tt))), dK = (tt) => askew(msub(Km, mscl(X, tt)));
          const ym = Math.max(1, dS(1), dK(1), dS(-1), dK(-1)) * 1.15;
          R.setView([-1, 1], [-0.04 * ym, ym]);
          R.fn(dS, { color: 'red', width: 2.6 }); R.fn(dK, { color: 'purple', width: 2.6, dash: [7, 4] });
          R.vline(t, { color: 'gold', width: 1.4 }); R.dot(t, dS(t), { r: 5, color: 'red' }); R.dot(t, dK(t), { r: 5, color: 'purple' });
          R.dot(0, 0, { r: 6, color: 'green', label: 't = 0', labelPos: 'ne' });
          const u = [1, 2, -1], w = [2, 0, 1];
          st = { b: bil(A, u, w), r: bil(Sm, u, w), a: bil(Km, u, w), okS, okK, t, kind: kind.value };
        });
        v.legend([['green', 'symmetric / skew'], ['red', '$\\|S\' - S\'^{t}\\|$'], ['purple', '$\\|K\' + K\'^{t}\\|$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const head = `For $u = (1, 2, -1)$, $w = (2, 0, 1)$: $\\ \\beta(u, w) = ${tn(st.b, 2)} = \\rho(u, w) + \\alpha(u, w) = ${tn(st.r, 2)} ${plus(st.a, 2)}$, with $\\rho = \\frac12\\big(\\beta(u, w) + \\beta(w, u)\\big)$ symmetric and $\\alpha = \\frac12\\big(\\beta(u, w) - \\beta(w, u)\\big)$ alternating. `;
          if (st.okS && st.okK) return head + (Math.abs(st.t) < 1e-9 ? 'At $t = 0$ the other split *is* the first one.' : 'Both parts are fine only because $X = 0$.');
          return head + `The other split fails: ${st.okS ? '' : '$S + tX$ is not symmetric'}${!st.okS && !st.okK ? ' and ' : ''}${st.okK ? '' : '$K - tX$ is not skew'} — the only matrix that is both symmetric and skew is $0$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.18
    {
      num: '9.18',
      kind: 'Definition',
      name: 'Quadratic form',
      statement: String.raw`For a bilinear form $\beta$ on $V$, define $q_\beta \colon V \to \mathbf F$ by
$$q_\beta(v) = \beta(v, v).$$
A function $q \colon V \to \mathbf F$ is called a **quadratic form** on $V$ if there exists a bilinear form $\beta$ on $V$ with $q = q_\beta$.`,
      idea: String.raw`A quadratic form is a bilinear form fed the same vector twice — its values on the "diagonal" pairs $(v, v)$. Much of $\beta$ is forgotten: $q_\beta = 0$ exactly when $\beta$ is alternating (9.14), so adding an alternating form to $\beta$ does not change $q_\beta$; by 9.21 what survives is precisely the symmetric part of $\beta$. Since $\beta(\lambda v, \lambda v) = \lambda^2\beta(v, v)$, every quadratic form is homogeneous of degree $2$, and along each line through $0$ its graph is a parabola. Example: $\beta(x, y) = x_1y_1 - 4x_1y_2 + 8x_1y_3 - 3x_3y_3$ on $\mathbf R^3$ gives $q_\beta(x) = x_1^2 - 4x_1x_2 + 8x_1x_3 - 3x_3^2$. Writing $\beta(u, v) = \langle u, Av\rangle$, $q(v) = \langle v, Av\rangle$ is $\|v\|$ times the component of $Av$ along $v$.`,
      caption: String.raw`Drag $v$ (gold). Left: $Av$ (blue) and its component along $v$ — green when $q(v) > 0$, red when $q(v) < 0$; $q(v) = \beta(v, v)$ is $\|v\|$ times that component. The background and purple lines show the sign and level curves of $q$, and the dashed gold curve is the level set through $v$. Right: the graph of $q$ (drag to rotate) with the parabola $t \mapsto q(tv)$ along the line of $v$. Add an alternating part: the matrix changes, $Av$ swings, but its component along $v$ — and hence the whole picture of $q$ — stays put. For an alternating $\beta$, $Av \perp v$ always and $q = 0$.`,
      deps: ['ladr-9.1'],
      see: ['ladr-9.14'],
      tags: ['quadratic forms'],
      viz(v) {
        const PRE = { gen: [[1, 1.2], [-0.4, -0.6]], ip: [[1.2, 0.3], [0.3, 0.7]], alt: [[0, 1], [-1, 0]] };
        const pre = v.select('$\\beta(u, v) = \\langle u, Av\\rangle$', [{ value: 'gen', label: 'a general $\\beta$' }, { value: 'ip', label: 'an inner product' }, { value: 'alt', label: 'an alternating $\\beta$' }], 'gen');
        const sk = v.slider('add the alternating form $s\\,(u_1v_2 - u_2v_1)$', -1.5, 1.5, 0, { step: 0.05 });
        const P = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 380, title: '$q(v) = \\beta(v, v) = \\langle v, Av\\rangle$' });
        const S3 = v.stage3d({ range: 1.9, height: 380, yaw: -0.6, pitch: 0.42, labels: ['x₁', 'x₂', 'q'], title: 'graph of $q$ over $\\|v\\| \\le 1.4$ (heights $\\times 0.5$)' });
        const vh = P.handle(1.0, 0.45, { color: 'gold', label: 'v', constrain: disc(1.4) });
        let st = null;
        v.render(() => {
          const B0 = PRE[pre.value], s = sk.value, A = [[B0[0][0], B0[0][1] + s], [B0[1][0] - s, B0[1][1]]];
          const q = (x, y) => bil(A, [x, y], [x, y]);
          signHeat(v, P, q, `${A.flat()}`, 2.2, 0.4);
          P.contour(q, [-2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5], { color: 'purple', width: 1, res: 100 });
          P.contour(q, [0], { color: 'purple', width: 2.2, res: 100 });
          P.axes();
          const w = [vh.x, vh.y], Aw = mv(A, w), qv = dot(w, Aw), u = unit(w), foot = scl(u, dot(Aw, u));
          if (Math.abs(qv) > 1e-4) P.clip(() => P.path(conic(A, qv), { color: 'gold', width: 1.8, dash: [6, 4] }));
          P.line(-3 * u[0], -3 * u[1], 3 * u[0], 3 * u[1], { color: 'gold', width: 1, alpha: 0.4 });
          P.line(Aw[0], Aw[1], foot[0], foot[1], { color: 'muted', width: 1.2, dash: [4, 4] });
          P.line(0, 0, foot[0], foot[1], { color: qv >= 0 ? 'green' : 'red', width: 7, alpha: 0.55 });
          P.arrow(0, 0, Aw[0], Aw[1], { color: 'accent', width: 2.6 }); tip(P, 'Av', Aw, 'accent', { size: 14 });
          P.arrow(0, 0, w[0], w[1], { color: 'gold', width: 2.6 });
          // the graph
          const k = 0.5, zm = 0.9;
          S3.surface((r, t) => { const x = r * Math.cos(t), y = r * Math.sin(t); return [x, y, k * q(x, y)]; }, [0, 1.4], [0, TAU], { nu: 14, nv: 56, alpha: 0.8, colorFn: (r, t, p) => v.mix('panel', p[2] >= 0 ? 'blue' : 'red', 0.12 + 0.75 * Math.min(1, Math.abs(p[2]) / zm)) });
          const rim = []; for (let j = 0; j <= 80; j++) { const t = (TAU * j) / 80; rim.push([1.4 * Math.cos(t), 1.4 * Math.sin(t), 0]); }
          S3.path(rim, { color: 'muted', width: 1 });
          const par = []; for (let j = -28; j <= 28; j++) { const t = (1.4 * j) / 28; par.push([t * u[0], t * u[1], k * q(t * u[0], t * u[1])]); }
          S3.path(par, { color: 'gold', width: 3, bias: -0.3 });
          S3.line([-1.4 * u[0], -1.4 * u[1], 0], [1.4 * u[0], 1.4 * u[1], 0], { color: 'gold', width: 1, alpha: 0.5 });
          S3.line([w[0], w[1], 0], [w[0], w[1], k * qv], { color: 'gold', width: 2 });
          S3.dot([w[0], w[1], k * qv], { r: 5.5, color: 'gold' });
          st = { A, qv, q2: q(2 * w[0], 2 * w[1]), Sym: symPart(A), comp: dot(Aw, u), nv: len(w), alt: pre.value === 'alt' };
        });
        v.legend([['gold', '$v$, the line through $v$, $t \\mapsto q(tv)$'], ['accent', '$Av$'], ['green', 'component of $Av$ along $v$ ($q > 0$)'], ['purple', 'level curves of $q$']]);
        v.readout(() => {
          if (!st) return '';
          const head = `$A = ${mtex(st.A)}$: $\\ q(v) = \\beta(v, v) = \\|v\\| \\cdot (\\text{component of } Av \\text{ along } v) = ${tn(st.nv, 3)} \\cdot ${tn(st.comp, 3)} = ${tn(st.qv, 3)}$; $\\ q(2v) = ${tn(st.q2, 3)} = 4q(v)$ ${mark(Math.abs(st.q2 - 4 * st.qv) < 1e-9)}. `;
          if (st.alt && Math.abs(st.A[0][0]) + Math.abs(st.A[1][1]) < 1e-12) return head + 'This $\\beta$ is alternating: $Av \\perp v$ for every $v$, so $q_\\beta = 0$ although $\\beta \\ne 0$.';
          return head + `$q$ depends only on the symmetric part $\\frac12(A + A^{t}) = ${mtex(st.Sym)}$ — the alternating part added by $s$ changes $\\beta$ but not $q_\\beta$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.20
    {
      num: '9.20',
      kind: 'Theorem',
      name: 'Quadratic forms on Fⁿ',
      statement: String.raw`Suppose $n$ is a positive integer and $q$ is a function from $\mathbf F^n$ to $\mathbf F$. Then $q$ is a quadratic form on $\mathbf F^n$ if and only if there exist numbers $A_{j,k} \in \mathbf F$, for $j, k \in \{1, \dots, n\}$, such that
$$q(x_1, \dots, x_n) = \sum_{k=1}^{n}\sum_{j=1}^{n} A_{j,k}\,x_jx_k \qquad\text{for all } (x_1, \dots, x_n) \in \mathbf F^n.$$`,
      idea: String.raw`If $q = q_\beta$, let $A$ be the matrix of $\beta$ in the standard basis (9.4); expanding $\beta(x, x)$ gives the formula. Conversely, given the numbers $A_{j,k}$, the formula $\sum A_{j,k}x_jy_k$ defines a bilinear form $\beta$ with $q_\beta = q$. So quadratic forms on $\mathbf F^n$ are exactly the homogeneous polynomials of degree $2$. The numbers are not determined by $q$: only the diagonal entries and the sums $A_{j,k} + A_{k,j}$ — the coefficients of $x_j^2$ and of $x_jx_k$ — matter. The matrices that represent a given $q$ form a translate of the space of skew matrices, which meets the symmetric matrices exactly once (9.21).`,
      caption: String.raw`Choose a target $q$; its curves $q = 1$ (blue) and $q = -1$ (orange) are drawn wide and pale. The diagonal of $A$ is fixed by $q$; drag the gold point on the right to choose the off-diagonal entries $A_{1,2}, A_{2,1}$. The thin curves are drawn from your matrix: anywhere on the blue line $A_{1,2} + A_{2,1} = b$ they sit exactly on the target, because only the sum enters $q$; the green dot is the one symmetric choice. Leave the line and the curves change. A linear term $\ell x_1$ makes a function that no matrix produces: its level sets are no longer symmetric about $0$ (compare $q(v)$ and $q(-v)$ at the teal points).`,
      deps: ['ladr-9.18', 'ladr-9.4'],
      tags: ['quadratic forms'],
      viz(v) {
        const TG = { hyp: [1, 3, 2], ell: [2, -2, 1.5], xy: [0, 1, 0] };
        const tg = v.select('target $q$', [{ value: 'hyp', label: '$x_1^2 + 3x_1x_2 + 2x_2^2$' }, { value: 'ell', label: '$2x_1^2 - 2x_1x_2 + 1.5x_2^2$' }, { value: 'xy', label: '$x_1x_2$' }], 'hyp', { onChange: (k) => { const b = TG[k][1]; oh.set(b / 2 + 1.1, b / 2 - 1.1); } });
        const lin = v.slider('add a linear term $\\ell\\,x_1$', -1, 1, 0, { step: 0.05 });
        const P = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 390, title: '$q = \\pm1$: target (wide) and from your $A$ (thin)' });
        const R = v.stage({ x: [-3, 4.5], y: [-3, 4.5], equal: true, height: 390, xlabel: 'A₁₂', ylabel: 'A₂₁', title: 'off-diagonal entries $(A_{1,2}, A_{2,1})$' });
        const oh = R.handle(2.6, 0.4, {
          color: 'gold', label: 'A', constrain: (x, y) => {
            const b = TG[tg.value][1], d = (x + y - b) / 2;
            if (Math.abs(d) * Math.SQRT2 < 0.12) { x -= d; y -= d; }
            return [Math.round(x * 20) / 20, Math.round(y * 20) / 20];
          },
        });
        const vh = P.handle(0.75, -0.55, { color: 'teal', label: 'v', constrain: disc(2) });
        let st = null;
        v.render(() => {
          const [a, b, c] = TG[tg.value], l = lin.value, A = [[a, oh.x], [oh.y, c]], Ts = [[a, b / 2], [b / 2, c]];
          const qA = (x, y) => bil(A, [x, y], [x, y]) + l * x;
          P.clip(() => { P.path(conic(Ts, 1), { color: 'accent', width: 9, alpha: 0.25 }); P.path(conic(Ts, -1), { color: 'orange', width: 9, alpha: 0.25 }); });
          P.contour(qA, [1], { color: 'accent', width: 2, res: 160 }); P.contour(qA, [-1], { color: 'orange', width: 2, res: 160 });
          const w = [vh.x, vh.y];
          P.line(w[0], w[1], -w[0], -w[1], { color: 'teal', width: 1, dash: [4, 4] });
          P.dot(-w[0], -w[1], { r: 5, color: 'teal', hollow: true, label: '−v', labelPos: 'sw' });
          // the plane of off-diagonal entries
          R.line(-6, b + 6, 9, b - 9, { color: 'accent', width: 2.6 });
          R.line(-6, -6, 9, 9, { color: 'muted', width: 1.2, dash: [6, 5] });
          R.dot(b / 2, b / 2, { r: 6, color: 'green', label: 'symmetric', labelPos: 'se' });
          const lx = Math.min(4.3, b + 2.6), ly = b - lx;
          R.tex(`A_{1,2} + A_{2,1} = ${tn(b)}`, lx, ly, { color: 'accent', size: 13, dx: -4, dy: 16, align: 'right' });
          R.text('A₁₂ = A₂₁', 3.6, 3.6, { color: 'muted', size: 11, align: 'right', dy: -10 });
          const on = Math.abs(oh.x + oh.y - b) < 1e-9;
          R.corner(on ? 'on the line: same q' : 'off the line: a different q', 'tl', { color: on ? 'green' : 'red', weight: 700 });
          st = { a, b, c, l, A, on, qv: qA(...w), qm: qA(-w[0], -w[1]), s12: oh.x + oh.y };
        });
        v.legend([['accent', '$q = 1$'], ['orange', '$q = -1$'], ['green', 'the symmetric matrix', { dot: true }], ['teal', '$v$ and $-v$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const mine = `$A = ${mtex(st.A)}$ gives $\\sum_{j,k} A_{j,k}x_jx_k = ${polyTex(st.a, st.s12, st.c)}$${Math.abs(st.l) > 1e-9 ? ` and the function is $${polyTex(st.a, st.s12, st.c)} ${plus(st.l)}x_1$` : ''}; the target is $${polyTex(st.a, st.b, st.c)}$. `;
          if (Math.abs(st.l) > 1e-9) return mine + `Now $q(v) = ${tn(st.qv, 3)}$ but $q(-v) = ${tn(st.qm, 3)}$: every $\\sum A_{j,k}x_jx_k$ takes equal values at $v$ and $-v$, so **no** choice of numbers $A_{j,k}$ produces this function — it is not a quadratic form.`;
          if (st.on) return mine + `**The same quadratic form** ${mark(true)}: only $A_{1,2} + A_{2,1} = ${tn(st.b)}$ matters, so every point of the blue line represents it; the symmetric one is $${mtex([[st.a, st.b / 2], [st.b / 2, st.c]])}$.`;
          return mine + `The coefficient of $x_1x_2$ is $${tn(st.s12)} \\ne ${tn(st.b)}$: a different quadratic form.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.21
    {
      num: '9.21',
      kind: 'Theorem',
      name: 'Characterizations of quadratic forms',
      statement: String.raw`Suppose $q \colon V \to \mathbf F$ is a function. The following are equivalent:
(a) $q$ is a quadratic form;
(b) there exists a unique symmetric bilinear form $\rho$ on $V$ such that $q = q_\rho$;
(c) $q(\lambda v) = \lambda^2q(v)$ for all $\lambda \in \mathbf F$ and $v \in V$, and the function $(u, w) \mapsto q(u + w) - q(u) - q(w)$ is a symmetric bilinear form on $V$;
(d) $q(2v) = 4q(v)$ for all $v \in V$, and the function $(u, w) \mapsto q(u + w) - q(u) - q(w)$ is a symmetric bilinear form on $V$.`,
      idea: String.raw`(a)⇒(b): if $q = q_\beta$, split $\beta = \rho + \alpha$ into symmetric and alternating parts (9.17); since $q_\alpha = 0$, $q = q_\rho$. If also $q = q_{\rho'}$ with $\rho'$ symmetric, then $\rho' - \rho$ is symmetric and has $q_{\rho' - \rho} = 0$, so it is also alternating, hence $0$. (b)⇒(c): $q(\lambda v) = \rho(\lambda v, \lambda v) = \lambda^2q(v)$, and $q(u + w) - q(u) - q(w) = 2\rho(u, w)$ — the **polarization identity**. (c)⇒(d) is the case $\lambda = 2$. (d)⇒(a): put $\rho(u, w) = \frac12\big(q(u + w) - q(u) - q(w)\big)$, a symmetric bilinear form by hypothesis; then $\rho(v, v) = \frac12\big(q(2v) - 2q(v)\big) = q(v)$. So the symmetric form behind a quadratic form is recovered from $q$ alone by polarization.`,
      caption: String.raw`Pick a candidate $q$ and drag $u$ (blue) and $w$ (gold). Right: $\lambda \mapsto q(\lambda u)$ (blue) against $\lambda^2q(u)$ (dashed); at $\lambda = 2$ the dot must land in the ring. Left, switch to the levels of $x \mapsto q(x + w) - q(x) - q(w)$: for a quadratic form they are straight, parallel, equally spaced lines (a linear functional of $x$), and half of it is $\rho(x, w)$. The squared $\ell^1$ norm passes the scaling tests but its polarization has bent levels; the log-periodic wiggle passes $q(2v) = 4q(v)$ yet fails everything else; $x_1^3 + x_2^2$ fails from the start. The readout runs all the tests on random vectors.`,
      deps: ['ladr-9.17', 'ladr-9.18'],
      tags: ['quadratic forms'],
      viz(v) {
        const CAND = {
          quad: { f: (x, y) => x * x + 1.5 * x * y - 0.5 * y * y, tex: 'x_1^2 + 1.5x_1x_2 - 0.5x_2^2' },
          l1: { f: (x, y) => (Math.abs(x) + Math.abs(y)) ** 2, tex: '(|x_1| + |x_2|)^2' },
          wig: { f: (x, y) => { const r2 = x * x + y * y; return r2 < 1e-300 ? 0 : r2 * (1 + 0.3 * Math.sin(Math.PI * Math.log2(r2))); }, tex: '\\|x\\|^2\\big(1 + 0.3\\sin(2\\pi\\log_2\\|x\\|)\\big)' },
          cub: { f: (x, y) => x * x * x + y * y, tex: 'x_1^3 + x_2^2' },
        };
        const cand = v.select('$q(x) =$', [{ value: 'quad', label: '$x_1^2 + 1.5x_1x_2 - 0.5x_2^2$' }, { value: 'l1', label: '$(|x_1| + |x_2|)^2$' }, { value: 'wig', label: 'log-periodic wiggle' }, { value: 'cub', label: '$x_1^3 + x_2^2$' }], 'quad');
        const show = v.select('left panel shows levels of', [{ value: 'q', label: '$q$' }, { value: 'P', label: '$x \\mapsto q(x + w) - q(x) - q(w)$' }], 'q');
        const L = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 380 });
        const G = v.stage({ x: [-2.5, 2.5], y: [-2, 6], axes: 'box', height: 380, xlabel: 'λ', title: '$\\lambda \\mapsto q(\\lambda u)$ vs $\\lambda^2 q(u)$' });
        const uh = L.handle(0.7, 0.35, { color: 'accent', label: 'u', constrain: disc(1.2) });
        const wh = L.handle(-0.75, 0.55, { color: 'gold', label: 'w', constrain: disc(1.2) });
        // a fixed random sample for the tests
        const r = v.rng(11), smp = Array.from({ length: 36 }, () => [r.uniform(-1.5, 1.5), r.uniform(-1.5, 1.5)]);
        let st = null, lastT = '';
        v.render(() => {
          const f = CAND[cand.value].f, q = (p) => f(p[0], p[1]), u = [uh.x, uh.y], w = [wh.x, wh.y];
          const Pol = (a, b) => q(add(a, b)) - q(a) - q(b);
          const g = show.value === 'q' ? (x, y) => f(x, y) : (x, y) => Pol([x, y], w);
          const ttl = show.value === 'q' ? `levels of $q(x) = ${CAND[cand.value].tex}$` : 'levels of $x \\mapsto q(x + w) - q(x) - q(w)$';
          if (ttl !== lastT) { L.setTitle(ttl); lastT = ttl; }
          let gm = 0.5; for (const p of [[2, 2], [2, -2], [-2, 2], [-2, -2], [2, 0], [0, 2], [-2, 0], [0, -2]]) gm = Math.max(gm, Math.abs(g(...p)));
          signHeat(v, L, g, `${cand.value}|${show.value}|${show.value === 'P' ? w : ''}`, gm, 0.4);
          const dl = niceStep(gm / 6), lv = []; for (let k = -14; k <= 14; k++) if (k) lv.push(k * dl);
          L.contour(g, lv, { color: 'purple', width: 1, res: 110 }); L.contour(g, [0], { color: 'purple', width: 2.2, res: 110 });
          L.axes();
          L.poly([[0, 0], u, add(u, w), w], { fill: 'green', fillAlpha: 0.05, color: 'muted', width: 1, dash: [4, 4] });
          L.arrow(0, 0, u[0], u[1], { color: 'accent', width: 2.6 }); L.arrow(0, 0, w[0], w[1], { color: 'gold', width: 2.6 });
          const uw = add(u, w); L.arrow(0, 0, uw[0], uw[1], { color: 'green', width: 2 }); tip(L, 'u + w', uw, 'green', { size: 13, off: 20 });
          // homogeneity graph
          const hq = (lam) => q(scl(u, lam)), qu = q(u);
          let ym = 1; for (let k = -50; k <= 50; k++) { const lam = (2.5 * k) / 50; ym = Math.max(ym, Math.abs(hq(lam)), Math.abs(lam * lam * qu)); }
          const lo = Math.min(-0.15 * ym, ...Array.from({ length: 51 }, (_, k) => Math.min(hq(-2.5 + k / 10), (-2.5 + k / 10) ** 2 * qu)));
          G.setView([-2.5, 2.5], [Math.min(-0.3, lo * 1.1), ym * 1.12]);
          G.hline(0, { color: 'muted', width: 1 });
          G.vline(2, { color: 'faint', width: 1, dash: [4, 4] });
          G.fn((lam) => lam * lam * qu, { color: 'ink', width: 1.6, dash: [6, 5] });
          G.fn(hq, { color: 'accent', width: 2.8 });
          G.dot(2, 4 * qu, { r: 9, hollow: true, color: 'ink', width: 2 });
          G.dot(2, hq(2), { r: 5, color: 'accent' });
          G.dot(1, qu, { r: 4, color: 'accent' });
          // the tests on the random sample
          const rel = (a, b) => Math.abs(a - b) / (1 + Math.abs(b));
          let t2 = 0, tl = 0, tb = 0;
          for (let i = 0; i < smp.length; i++) {
            const x = smp[i], x2 = smp[(i + 7) % smp.length], y = smp[(i + 13) % smp.length];
            t2 = Math.max(t2, rel(q(scl(x, 2)), 4 * q(x)));
            for (const lam of [-1.3, 0.6, 1.7]) tl = Math.max(tl, rel(q(scl(x, lam)), lam * lam * q(x)));
            tb = Math.max(tb, rel(Pol(add(x, x2), y), Pol(x, y) + Pol(x2, y)), rel(Pol(scl(x, 0.7), y), 0.7 * Pol(x, y)));
          }
          const e1 = [1, 0], e2 = [0, 1], rho = [[q(e1), Pol(e1, e2) / 2], [Pol(e1, e2) / 2, q(e2)]];
          st = { t2, tl, tb, rho, quad: t2 < 1e-9 && tl < 1e-9 && tb < 1e-9, Puw: Pol(u, w), qu, quw: q(uw), qw: q(w), rv: bil(rho, u, u) };
        });
        v.legend([['accent', '$q(\\lambda u)$'], ['ink', '$\\lambda^2 q(u)$', { dash: true }], ['purple', 'level lines'], ['green', '$u + w$']]);
        v.readout(() => {
          if (!st) return '';
          const tests = `Tests on 36 random vectors: (d) $q(2v) = 4q(v)$ ${mark(st.t2 < 1e-9)} $\\cdot$ (c) $q(\\lambda v) = \\lambda^2q(v)$ ${mark(st.tl < 1e-9)} $\\cdot$ $(u, w) \\mapsto q(u + w) - q(u) - q(w)$ bilinear ${mark(st.tb < 1e-9)} (worst relative error $${v.sci(Math.max(st.tb, 1e-17), 2)}$). `;
          const pol = `Polarization at $u, w$: $\\frac12\\big(q(u + w) - q(u) - q(w)\\big) = \\frac12(${tn(st.quw, 3)} ${plus(-st.qu, 3)} ${plus(-st.qw, 3)}) = ${tn(st.Puw / 2, 3)}$`;
          if (st.quad) return tests + pol + ` $= \\rho(u, w)$, where $\\rho$ has matrix $${mtex(st.rho, 3)}$ and $\\rho(u, u) = ${tn(st.rv, 4)} = q(u)$ ${mark(Math.abs(st.rv - st.qu) < 1e-9)}: a quadratic form, with its unique symmetric $\\rho$.`;
          return tests + pol + ' — but this is not a bilinear function of $(u, w)$, so $q$ is **not** a quadratic form.';
        });
      },
    },

    // ------------------------------------------------------------------ 9.23
    {
      num: '9.23',
      kind: 'Theorem',
      name: 'Diagonalization of quadratic form',
      statement: String.raw`Suppose $q$ is a quadratic form on $V$.
(a) There exist a basis $e_1, \dots, e_n$ of $V$ and $\lambda_1, \dots, \lambda_n \in \mathbf F$ such that
$$q(x_1e_1 + \cdots + x_ne_n) = \lambda_1x_1^2 + \cdots + \lambda_nx_n^2 \qquad\text{for all } x_1, \dots, x_n \in \mathbf F.$$
(b) If $\mathbf F = \mathbf R$ and $V$ is an inner product space, then the basis in (a) can be chosen to be orthonormal.`,
      idea: String.raw`By 9.21, $q = q_\rho$ for a symmetric bilinear form $\rho$, and by 9.12 some basis $e_1, \dots, e_n$ makes $\mathcal M(\rho)$ diagonal, with entries $\lambda_j = \rho(e_j, e_j)$. Expanding $\rho\big(\sum_j x_je_j, \sum_k x_ke_k\big) = \sum_{j,k}x_jx_k\,\rho(e_j, e_k)$ kills every cross term. Part (b) is 9.13. The $\lambda_j$ are far from unique — replacing $e_j$ by $te_j$ multiplies $\lambda_j$ by $t^2$, and different bases give different values. But over $\mathbf R$ the numbers of positive, negative and zero $\lambda_j$ are the same for every such basis (Sylvester's law of inertia), so the shape of the level sets of $q$ is intrinsic. On $\mathbf R^2$, completing the square, $ax_1^2 + bx_1x_2 + cx_2^2 = a\big(x_1 + \frac b{2a}x_2\big)^2 + \big(c - \frac{b^2}{4a}\big)x_2^2$, is one diagonalization; the principal axes, with the eigenvalues as $\lambda$'s, are another.`,
      caption: String.raw`Pick $q$; its level sets $q = 1$ (blue) and $q = -1$ (orange) are an ellipse, a hyperbola, a pair of lines or nothing. In *your own* mode drag $e_1$; $e_2$ slides along the dashed line of vectors $\rho$-orthogonal to $e_1$, so $q(x_1e_1 + x_2e_2) = \lambda_1x_1^2 + \lambda_2x_2^2$ with $\lambda_j = q(e_j)$. Right: the point $(\lambda_1, \lambda_2)$ for your basis (gold, with its trail), for the principal axes (green; orthonormal, $\lambda$'s are the eigenvalues) and for completing the square (orange). However you drag, the gold point never leaves its quadrant: the signs of the $\lambda$'s are fixed by $q$. Release $e_2$ from the dashed line and a cross term $x_1x_2$ appears.`,
      deps: ['ladr-9.21', 'ladr-9.12', 'ladr-9.13'],
      see: ['dg-6.13'],
      tags: ['quadratic forms', 'diagonalization'],
      viz(v) {
        const PRE = { hyp: [1, 3, 2], ell: [2, -2, 1.5], deg: [1, 2, 1], neg: [-1, 1, -1.2] };
        const pre = v.select('$q$', [{ value: 'hyp', label: '$x_1^2 + 3x_1x_2 + 2x_2^2$' }, { value: 'ell', label: '$2x_1^2 - 2x_1x_2 + 1.5x_2^2$' }, { value: 'deg', label: '$(x_1 + x_2)^2$' }, { value: 'neg', label: '$-x_1^2 + x_1x_2 - 1.2x_2^2$' }], 'hyp', { onChange: () => { trail.length = 0; } });
        const mode = v.select('basis', [{ value: 'own', label: 'your own' }, { value: 'pr', label: 'principal axes (orthonormal)' }, { value: 'sq', label: 'completing the square' }], 'own');
        const conj = v.toggle('keep $e_2$ $\\rho$-orthogonal to $e_1$', true);
        const P = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, height: 400 });
        const R = v.stage({ x: [-1.12, 1.12], y: [-1.12, 1.12], equal: true, axes: false, height: 400, title: 'the coefficients $(\\lambda_1, \\lambda_2)$ (compressed scale)' });
        const Smat = () => { const [a, b, c] = PRE[pre.value]; return [[a, b / 2], [b / 2, c]]; };
        const conjDir = (e) => { const n = mv(Smat(), e); return len(n) < 1e-9 ? unit(rot90(e)) : unit(rot90(n)); };
        const e1h = P.handle(1.1, -0.25, { color: 'teal', label: 'e₁' });
        const e2h = P.handle(-0.6, 0.8, { color: 'pink', label: 'e₂', constrain: (x, y) => { if (!conj.value) return [x, y]; const d = conjDir([e1h.x, e1h.y]), t = x * d[0] + y * d[1]; return [t * d[0], t * d[1]]; } });
        const trail = [], LM = 20, C = (l) => Math.max(-1.08, Math.min(1.08, slog(l) / slog(LM)));
        let st = null;
        v.render(() => {
          const [a, b, c] = PRE[pre.value], Sm = Smat(), q = (p) => bil(Sm, p, p);
          const E = esym2(Sm), pr = { e: [E.u[0], E.u[1]], l: E.l };
          const sq = Math.abs(a) > 1e-9 ? { e: [[1, 0], [-b / (2 * a), 1]], l: [a, c - (b * b) / (4 * a)] } : Math.abs(c) > 1e-9 ? { e: [[1, -b / (2 * c)], [0, 1]], l: [-(b * b) / (4 * c), c] } : { e: [[1, 1], [1, -1]], l: [b, -b] };
          const own = mode.value === 'own';
          e1h.visible = own; e2h.visible = own; conj.el.hidden = !own;
          if (own && conj.value) { const d = conjDir([e1h.x, e1h.y]); let t = e2h.x * d[0] + e2h.y * d[1]; if (Math.abs(t) < 0.25) t = t < 0 ? -0.9 : 0.9; e2h.x = t * d[0]; e2h.y = t * d[1]; }
          const ow = { e: [[e1h.x, e1h.y], [e2h.x, e2h.y]] }; ow.l = ow.e.map(q); ow.cross = 2 * bil(Sm, ow.e[0], ow.e[1]);
          const cur = mode.value === 'pr' ? pr : mode.value === 'sq' ? sq : ow, [f1, f2] = cur.e, isB = Math.abs(det2(f1, f2)) > 0.05;
          const diagOwn = Math.abs(ow.cross) < 1e-9 && Math.abs(det2(...ow.e)) > 0.05;
          // the plane
          if (isB) skewGrid(P, f1, f2, { alpha: 0.2 });
          P.clip(() => { P.path(conic(Sm, 1), { color: 'accent', width: 2.8 }); P.path(conic(Sm, -1), { color: 'orange', width: 2.8 }); });
          if (own && conj.value) { const d = conjDir(f1); P.line(-4 * d[0], -4 * d[1], 4 * d[0], 4 * d[1], { color: 'pink', width: 1.2, dash: [6, 5], alpha: 0.8 }); }
          P.arrow(0, 0, f1[0], f1[1], { color: 'teal', width: 3 }); P.arrow(0, 0, f2[0], f2[1], { color: 'pink', width: 3 });
          if (!own) { tip(P, 'e_1', f1, 'teal', { off: 16 }); tip(P, 'e_2', f2, 'pink', { off: 16 }); }
          const sg = signature(pr.l, 1e-9), key = sg.join('');
          const TYPE = { '200': 'q = 1: an ellipse', '110': 'q = 1: a hyperbola', '020': 'q = 1: no points (q = −1: an ellipse)', '101': 'q = 1: two parallel lines', '011': 'q = 1: no points', '002': 'q = 0 everywhere' };
          P.corner(TYPE[key] || '', 'tl', { color: 'ink', weight: 700 });
          // the (λ₁, λ₂) plane
          const Q = [[0, 0, 1.12, 1.12, 'blue'], [-1.12, -1.12, 0, 0, 'red'], [-1.12, 0, 0, 1.12, 'purple'], [0, -1.12, 1.12, 0, 'purple']];
          for (const [x0, y0, x1, y1, col] of Q) R.rect(x0, y0, x1, y1, { fill: col, fillAlpha: 0.07, stroke: false });
          R.line(-1.12, 0, 1.12, 0, { color: 'ink', width: 1.2 }); R.line(0, -1.12, 0, 1.12, { color: 'ink', width: 1.2 });
          for (const t of [1, 3, 10]) for (const sgn of [-1, 1]) {
            const z = C(sgn * t);
            R.line(z, -0.025, z, 0.025, { color: 'ink', width: 1 }); R.line(-0.025, z, 0.025, z, { color: 'ink', width: 1 });
            R.text(pn(sgn * t, 0), z, 0, { align: 'center', size: 10, color: 'muted', dy: 11 }); R.text(pn(sgn * t, 0), 0, z, { align: 'right', size: 10, color: 'muted', dx: -6 });
          }
          R.tex('\\lambda_1', 1.1, 0, { size: 14, dy: -12, align: 'right' }); R.tex('\\lambda_2', 0, 1.1, { size: 14, dx: 12, align: 'left' });
          R.text('ellipse', 0.62, 0.95, { align: 'center', size: 12, color: 'blue', weight: 700 });
          R.text('hyperbola', -0.62, 0.95, { align: 'center', size: 12, color: 'purple', weight: 700 });
          R.text('hyperbola', 0.62, -0.95, { align: 'center', size: 12, color: 'purple', weight: 700 });
          R.text('no points', -0.62, -0.95, { align: 'center', size: 12, color: 'red', weight: 700 });
          if (own && diagOwn) { const p = [C(ow.l[0]), C(ow.l[1])]; const lp = trail[trail.length - 1]; if (!lp || Math.hypot(lp[0] - p[0], lp[1] - p[1]) > 0.01) { trail.push(p); if (trail.length > 400) trail.shift(); } }
          R.dots(trail, { r: 2, color: 'gold', alpha: 0.35 });
          R.dot(C(pr.l[0]), C(pr.l[1]), { r: 7, color: 'green', label: 'principal', labelPos: 'ne' });
          R.dot(C(sq.l[0]), C(sq.l[1]), { r: 7, color: 'orange', label: 'square', labelPos: 'sw' });
          if (diagOwn) R.dot(C(ow.l[0]), C(ow.l[1]), { r: 7, color: 'gold', label: 'yours', labelPos: 'se' });
          st = { pr, sq, ow, own, diagOwn, cur, sg, sgs: signature(sq.l, 1e-9), sgo: signature(ow.l, 1e-9), conj: conj.value, type: TYPE[key] };
        });
        v.legend([['accent', '$q = 1$'], ['orange', '$q = -1$'], ['teal', '$e_1$'], ['pink', '$e_2$'], ['gold', 'your $(\\lambda_1, \\lambda_2)$ and its trail', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const L = (o) => `(${tn(o.l[0])}, ${tn(o.l[1])})`;
          if (st.own && !st.diagOwn) return `$q(x_1e_1 + x_2e_2) = ${polyTex(st.ow.l[0], st.ow.cross, st.ow.l[1])}$ — $e_2$ is not $\\rho$-orthogonal to $e_1$, so the cross term $2\\rho(e_1, e_2)\\,x_1x_2$ survives and this basis does not diagonalize $q$.`;
          const c = st.cur;
          return `In this basis $q(x_1e_1 + x_2e_2) = ${polyTex(c.l[0], 0, c.l[1])}$. Principal axes: $\\lambda = ${L(st.pr)}$ (the eigenvalues); completing the square: $${L(st.sq)}$${st.own ? `; yours: $${L(st.ow)}$` : ''}. Signs $(n_+, n_-, n_0) = (${st.sg.join(', ')})$ ${mark(st.sg.join() === st.sgs.join() && (!st.own || st.sg.join() === st.sgo.join()))} in every case (Sylvester's law of inertia) — and so ${st.type.replace('q = 1:', '$q = 1$ is')}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.25
    {
      num: '9.25',
      kind: 'Definition',
      name: 'Multilinear form',
      statement: String.raw`For a positive integer $m$, write $V^m = V \times \cdots \times V$ ($m$ times).
- An **$m$-linear form** on $V$ is a function $\beta \colon V^m \to \mathbf F$ that is linear in each slot when the other slots are held fixed: for each $k \in \{1, \dots, m\}$ and all $u_1, \dots, u_m \in V$, the function $v \mapsto \beta(u_1, \dots, u_{k-1}, v, u_{k+1}, \dots, u_m)$ is a linear map from $V$ to $\mathbf F$.
- The set of $m$-linear forms on $V$ is denoted $V^{(m)}$; it is a vector space under the usual operations.
- A function $\beta$ is a **multilinear form** on $V$ if it is an $m$-linear form on $V$ for some positive integer $m$.`,
      idea: String.raw`A 1-linear form is a linear functional and a 2-linear form is a bilinear form (9.1). Further examples: $\alpha(v_1, v_2)\,\rho(v_3, v_4)$ for $\alpha, \rho \in V^{(2)}$ is 4-linear; $\operatorname{tr}(T_1T_2\cdots T_m)$ is an $m$-linear form on $\mathcal L(V)$; and on $\mathbf R^3$ the signed volume $\det(u, v, w)$ of the parallelepiped on $u, v, w$ is a 3-linear form — the one that, in its alternating incarnation, will become the determinant (9.27 onward). Linearity in each slot separately is not linearity on $V^m$: $\beta(2u, 2v, 2w) = 8\,\beta(u, v, w)$. In a basis, expanding every slot shows that an $m$-linear form is determined by its $(\dim V)^m$ values on lists of basis vectors.`,
      caption: String.raw`Drag $u$, $v$, $w$ (the three inputs) and the test vector $y$ (gold) in $\mathbf R^3$; drag the background to rotate. On the right, each slot $k$ in turn is fed $x_k + t\,y$ while the other two stay frozen, and $\beta$ is plotted against $t$ (solid), together with the straight line $\beta(\ldots x_k \ldots) + t\,\beta(\ldots y \ldots)$ that linearity predicts (dashed). For $\det$ and for $\langle u, v\rangle w_3$ all three solid curves are straight and lie on their dashed lines. For $\langle u, v\rangle\langle v, w\rangle$ the second slot bends into a parabola: $v$ appears twice, so the function is linear in slots 1 and 3 but not in slot 2. The dashed gold line in 3D is the test line of the chosen slot.`,
      deps: ['ladr-3.110'],
      see: ['ladr-9.1', 'mfd-6.5'],
      tags: ['multilinear'],
      viz(v) {
        const FORMS = {
          det: { f: (a, b, c) => det3(a, b, c), tex: '\\det(u, v, w)' },
          dc: { f: (a, b, c) => dot(a, b) * c[2], tex: '\\langle u, v\\rangle\\, w_3' },
          bad: { f: (a, b, c) => dot(a, b) * dot(b, c), tex: '\\langle u, v\\rangle\\langle v, w\\rangle' },
        };
        const form = v.select('$\\beta(u, v, w) =$', [{ value: 'det', label: '$\\det(u, v, w)$' }, { value: 'dc', label: '$\\langle u, v\\rangle\\,w_3$' }, { value: 'bad', label: '$\\langle u, v\\rangle\\langle v, w\\rangle$' }], 'det');
        const slot = v.select('test line in slot', [{ value: 0, label: '1' }, { value: 1, label: '2' }, { value: 2, label: '3' }], 1);
        const S = v.stage({ x: [-2, 2], y: [-1.8, 1.8], equal: true, axes: false, height: 400, weight: 1.1 });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.3, axis: 1.4, lim: 1.4 });
        const G = v.stage({ x: [-1.5, 1.5], y: [-2, 2], axes: 'box', height: 400, weight: 0.9, minWidth: 260, xlabel: 't', title: 'slot $k$ fed $x_k + t\\,y$, the others frozen' });
        const COL = ['accent', 'orange', 'purple'], NAME = ['u', 'v', 'w'];
        const hs = [sc.handle([1, 0.15, 0.2], { color: 'accent', label: 'u' }), sc.handle([0.2, 1, 0.15], { color: 'orange', label: 'v' }), sc.handle([0.15, 0.35, 1], { color: 'purple', label: 'w' })];
        const yh = sc.handle([0.7, -0.6, 0.45], { color: 'gold', label: 'y' });
        let st = null;
        v.render(() => {
          const F = FORMS[form.value].f, X = hs.map((h) => h.p), y = yh.p, k0 = slot.value;
          const repl = (k, z) => { const Lst = X.slice(); Lst[k] = z; return F(...Lst); };
          sc.begin();
          if (form.value === 'det') {
            const [a, b, c] = X, P = (i, j, k) => [0, 1, 2].map((t) => i * a[t] + j * b[t] + k * c[t]), d = det3(a, b, c), col = d >= 0 ? 'blue' : 'red';
            const faces = [[[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], [[0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]], [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]]];
            for (const f of faces) sc.poly(f.map((q) => P(...q)), { fill: col, color: col, fillAlpha: 0.06, alpha: 0.35, width: 1 });
          }
          const p0 = X[k0];
          sc.line(add(p0, scl(y, -1.5)), add(p0, scl(y, 1.5)), { color: 'gold', width: 1.6, dash: [5, 4] });
          sc.dot(add(p0, y), { r: 4, color: 'gold' });
          X.forEach((p, k) => sc.arrow([0, 0, 0], p, { color: COL[k], width: k === k0 ? 3.4 : 2.6 }));
          sc.arrow([0, 0, 0], y, { color: 'gold', width: 2 });
          sc.flush();
          // the three slot graphs
          const fk = X.map((_, k) => (t) => repl(k, add(X[k], scl(y, t)))), lk = X.map((_, k) => { const b0 = repl(k, X[k]), b1 = repl(k, y); return (t) => b0 + t * b1; });
          let ym = 0.8; for (let k = 0; k < 3; k++) for (let j = 0; j <= 30; j++) { const t = -1.5 + j / 10; ym = Math.max(ym, Math.abs(fk[k](t)), Math.abs(lk[k](t))); }
          G.setView([-1.5, 1.5], [-ym * 1.12, ym * 1.12]);
          G.hline(0, { color: 'muted', width: 1 }); G.vline(0, { color: 'muted', width: 1 });
          for (let k = 0; k < 3; k++) {
            const em = k === k0;
            G.fn(lk[k], { color: COL[k], width: em ? 1.8 : 1.2, dash: [6, 5], alpha: em ? 1 : 0.55 });
            G.fn(fk[k], { color: COL[k], width: em ? 3.2 : 1.8, alpha: em ? 1 : 0.55 });
          }
          G.dot(0, repl(0, X[0]), { r: 5, color: 'ink' });
          const defect = X.map((_, k) => repl(k, add(X[k], y)) - repl(k, X[k]) - repl(k, y));
          st = { b: F(...X), defect, b8: F(...X.map((p) => scl(p, 2))), k0, name: form.value };
        });
        v.legend([['accent', 'slot 1 ($u$)'], ['orange', 'slot 2 ($v$)'], ['purple', 'slot 3 ($w$)'], ['ink', 'prediction from linearity', { dash: true }], ['gold', 'test vector $y$']]);
        v.readout(() => {
          if (!st) return '';
          const lab = ['\\beta(u + y, v, w) - \\beta(u, v, w) - \\beta(y, v, w)', '\\beta(u, v + y, w) - \\beta(u, v, w) - \\beta(u, y, w)', '\\beta(u, v, w + y) - \\beta(u, v, w) - \\beta(u, v, y)'];
          const k = st.k0, ok = st.defect.map((d) => Math.abs(d) < 1e-9);
          let s = `$\\beta(u, v, w) = ${tn(st.b, 3)}$. Slot ${k + 1}: $${lab[k]} = ${tn(st.defect[k], 3)}$ ${mark(ok[k])}; additivity in the three slots: ${ok.map(mark).join(' ')}. `;
          if (ok.every((x) => x)) s += `A 3-linear form — but not a linear map on $V^3$: $\\beta(2u, 2v, 2w) = ${tn(st.b8, 3)} = 8\\beta(u, v, w)$.`;
          else s += 'Linear in slots 1 and 3, not in slot 2 (where $v$ enters twice): **not** a 3-linear form.';
          return s;
        });
      },
    },
  ],
};
