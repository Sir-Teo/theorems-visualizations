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
  ],
};
