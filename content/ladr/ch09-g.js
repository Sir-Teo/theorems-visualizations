// Linear Algebra Done Right (Axler, 4th ed.) — Chapter 9: Multilinear Algebra and Determinants
// Part 7 (9.68–9.77): tensor products of two spaces — bilinear functionals ℬ(V, W) and their dimension, the tensor
// product V ⊗ W and v ⊗ w, its dimension, bilinearity of ⊗, the basis e_j ⊗ f_k, and bilinear maps.
// Part 8 (9.79–9.92) is ch09-h.js; 9.1–9.67 live in ch09.js … ch09-f.js.
//
// Throughout, an element of F^m ⊗ F^n is drawn as its m-by-n array of coefficients in the basis e_j ⊗ f_k
// (Axler's example 9.76): v ⊗ w is the "multiplication table" v wᵀ, blue cells positive, red cells negative.

// =====================================================================================================
// Shared helpers
// =====================================================================================================
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const sub = (k) => String(k).split('').map((d) => SUBS[+d]).join('');
/** A number for TeX: at most d decimals, trailing zeros dropped, never "-0". */
function tn(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  let s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
}
/** The same for canvas text (real minus sign). */
const pn = (x, d = 2) => tn(x, d).replace('-', '−');
const vtex = (p, d = 2) => `(${p.map((x) => tn(x, d)).join(',\\,')})`;
const mark = (ok) => (ok ? '✓' : '✗');
/** A small error for TeX: 0 stays 0, otherwise scientific. */
const etx = (M, e) => (e === 0 ? '0' : M.sci(e, 2));

// ---------- vectors and matrices (arrays of rows) ----------
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const add = (a, b) => a.map((x, i) => x + b[i]);
const subv = (a, b) => a.map((x, i) => x - b[i]);
const scl = (a, k) => a.map((x) => x * k);
const len = (a) => Math.hypot(...a);
const unit = (a) => { const l = len(a); return l > 1e-12 ? scl(a, 1 / l) : a.map(() => 0); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const mv = (A, x) => A.map((r) => dot(r, x));
const transp = (A) => A[0].map((_, j) => A.map((r) => r[j]));
const outer = (a, b) => a.map((x) => b.map((y) => x * y));
const madd = (A, B) => A.map((r, i) => r.map((x, j) => x + B[i][j]));
const msub = (A, B) => A.map((r, i) => r.map((x, j) => x - B[i][j]));
const mscl = (A, k) => A.map((r) => r.map((x) => x * k));
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
const maxAbs = (A) => { let m = 0; for (const x of A.flat(Infinity)) m = Math.max(m, Math.abs(x)); return m; };
const fromCols = (cs) => cs[0].map((_, i) => cs.map((c) => c[i]));
const r1 = (x) => Math.round(x * 10) / 10;
/** Numerical rank from singular values (relative tolerance). */
const nrank = (S, rel = 1e-9) => S.filter((s) => s > rel * Math.max(S[0] || 0, 1e-300) && s > 1e-13).length;
/** Two orthonormal vectors perpendicular to n (n ≠ 0) in R³. */
function perpPair(n) {
  const u = unit(n), e = Math.abs(u[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0];
  const a = unit(cross(u, e));
  return [a, cross(u, a)];
}

// ---------- drawing ----------
/**
 * Draw the array A (rows top to bottom) on a 2D stage with square cells of side c (data units); (x0, y0) is the
 * top-left corner. Positive entries are tinted blue and negative ones red, by |a| / scale.
 * o: {scale, numbers, dec, size, frame, fw, hl: [[i, j, colour]], alpha, minPx}
 */
function grid(S, A, x0, y0, c, o = {}) {
  const m = A.length, n = A[0].length, s = o.scale || Math.max(1e-9, maxAbs(A)), dec = o.dec ?? 2;
  const px = Math.abs(S.X(c) - S.X(0)), fs = o.size ?? Math.max(8, Math.min(13, px * 0.3));
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
    const a = A[i][j], X = x0 + j * c, Y = y0 - (i + 1) * c, t = Math.min(1, Math.abs(a) / s);
    if (t > 1e-9) S.rect(X, Y, X + c, Y + c, { fill: a > 0 ? 'blue' : 'red', fillAlpha: (o.alpha ?? 0.6) * (0.1 + 0.9 * t), stroke: false });
    if (o.numbers !== false && px >= (o.minPx ?? 26)) S.text(pn(a, dec), X + c / 2, Y + c / 2, { size: fs, align: 'center', baseline: 'middle', color: Math.abs(a) < 0.5 * 10 ** -dec ? 'faint' : 'ink', halo: false });
  }
  for (let k = 1; k < n; k++) S.line(x0 + k * c, y0, x0 + k * c, y0 - m * c, { color: 'grid', width: 0.7 });
  for (let k = 1; k < m; k++) S.line(x0, y0 - k * c, x0 + n * c, y0 - k * c, { color: 'grid', width: 0.7 });
  S.rect(x0, y0 - m * c, x0 + n * c, y0, { color: o.frame || 'muted', width: o.fw ?? 1.2 });
  for (const [i, j, col] of o.hl || []) S.rect(x0 + j * c, y0 - (i + 1) * c, x0 + (j + 1) * c, y0 - i * c, { color: col || 'accent', width: 2.4 });
  return { x0, y0, x1: x0 + n * c, y1: y0 - m * c, cx: x0 + (n * c) / 2, cy: y0 - (m * c) / 2 };
}
/**
 * A vector drawn as bars: orient 'h' = horizontal bars at heights pos[k] (beside the rows of a grid), 'v' = vertical
 * bars at abscissae pos[k] (above or below the columns). zero = the base line, sc = data units per unit value,
 * lim = largest |value| drawn, cell = spacing of the bars, side = where the value labels go ('left'/'right' for 'h',
 * 'top'/'bottom' for 'v'). With edit (default) every bar tip is a handle; dragging writes vals[k], snapped to 0.1.
 */
function bars(S, vals, o) {
  const H = o.orient === 'h', cell = o.cell ?? 1;
  const hs = o.edit === false ? [] : vals.map((_, k) => S.handle(0, 0, {
    color: o.color, r: 5.5,
    constrain: (x, y) => {
      const t = Math.max(-o.lim, Math.min(o.lim, r1(((H ? x : y) - o.zero) / o.sc)));
      vals[k] = t; if (o.onChange) o.onChange(k, t);
      return H ? [o.zero + t * o.sc, o.pos[k]] : [o.pos[k], o.zero + t * o.sc];
    },
  }));
  return {
    hs,
    show(b) { hs.forEach((h) => { h.visible = b; }); },
    draw(V = vals, st = {}) {
      const col = st.color || o.color, L = o.lim * o.sc, th = (o.thick ?? 0.17) * cell, dec = st.dec ?? 1;
      const lo = Math.min(...o.pos) - 0.45 * cell, hi = Math.max(...o.pos) + 0.45 * cell;
      if (H) S.line(o.zero, lo, o.zero, hi, { color: 'muted', width: 1 }); else S.line(lo, o.zero, hi, o.zero, { color: 'muted', width: 1 });
      V.forEach((t, k) => {
        const tt = Math.max(-o.lim, Math.min(o.lim, t)), e = o.zero + tt * o.sc, p = o.pos[k];
        if (Math.abs(tt) > 1e-9) {
          if (H) S.rect(o.zero, p - th, e, p + th, { fill: col, fillAlpha: 0.45, color: col, width: 1.2 });
          else S.rect(p - th, o.zero, p + th, e, { fill: col, fillAlpha: 0.45, color: col, width: 1.2 });
        }
        if (Math.abs(t) > o.lim + 1e-9) { // overflow: a chevron at the clipped end
          const g = Math.sign(t) * 0.12 * cell;
          if (H) S.poly([[e, p - th * 1.6], [e + g, p], [e, p + th * 1.6]], { fill: col, fillAlpha: 0.9, color: col, width: 1 });
          else S.poly([[p - th * 1.6, e], [p, e + g], [p + th * 1.6, e]], { fill: col, fillAlpha: 0.9, color: col, width: 1 });
        }
        if (st.labels !== false) {
          const lab = pn(t, dec);
          if (H) { const right = o.side === 'right'; S.text(lab, o.zero + (right ? 1 : -1) * (L + 0.1 * cell), p, { size: 11.5, align: right ? 'left' : 'right', color: col, weight: 600 }); }
          else { const bot = o.side === 'bottom'; S.text(lab, p, o.zero + (bot ? -1 : 1) * (L + 0.14 * cell), { size: 11.5, align: 'center', color: col, weight: 600 }); }
        }
        if (hs[k] && !hs[k].dragging) { hs[k].x = H ? e : p; hs[k].y = H ? p : e; }
      });
    },
  };
}
/** Signed scalar field on a 2D stage: blue > 0, red < 0, panel colour at 0 (palette-aware, cached by key). */
function signedHeat(v, S, f, range, key, res = 3) {
  const P = v.rgb('panel'), B = v.rgb('blue'), R = v.rgb('red');
  S.raster((x, y) => {
    const t = Math.max(-1, Math.min(1, f(x, y) / range)), C = t >= 0 ? B : R, a = 0.6 * Math.abs(t) ** 0.8;
    return [P[0] + (C[0] - P[0]) * a, P[1] + (C[1] - P[1]) * a, P[2] + (C[2] - P[2]) * a];
  }, { res, key: `${key}|${P.join()}|${B.join()}` });
}

export default {
  collection: 'ladr',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.68
    {
      num: '9.68',
      kind: 'Definition',
      name: 'Bilinear functionals ℬ(V, W)',
      statement: String.raw`Suppose $V$ and $W$ are vector spaces over $\mathbf F$.
- A **bilinear functional** on $V \times W$ is a function $\beta\colon V \times W \to \mathbf F$ that is linear in each slot when the other slot is held fixed: for each $w \in W$ the map $v \mapsto \beta(v, w)$ is a linear functional on $V$, and for each $v \in V$ the map $w \mapsto \beta(v, w)$ is a linear functional on $W$.
- With pointwise addition and scalar multiplication of functions, the bilinear functionals on $V \times W$ form a vector space, denoted $\mathcal B(V, W)$, whose zero is the zero function.`,
      idea: String.raw`When $W = V$ these are exactly the bilinear forms of 9.1. Typical examples: $\beta(v, w) = \varphi(v)\tau(w)$ for $\varphi \in V'$ and $\tau \in W'$; the evaluation pairing $(v, \varphi) \mapsto \varphi(v)$ on $V \times V'$; and $(A, B) \mapsto \operatorname{tr}(AB)$ on $\mathbf F^{m,n} \times \mathbf F^{n,m}$. With bases $e_1, \dots, e_m$ of $V$ and $f_1, \dots, f_n$ of $W$, bilinearity gives $\beta\big(\sum_j a_j e_j, \sum_k b_k f_k\big) = \sum_{j,k} \beta(e_j, f_k)\, a_j b_k$, so on $\mathbf F^m \times \mathbf F^n$ every bilinear functional is $v^{\mathsf T} C w$ for one matrix $C$ — the seed of 9.70. Bilinear is not the same as linear on the product space $V \times W$: a linear functional such as $(v, w) \mapsto v_1 + w_1$ is additive in the *pair*, while a bilinear one satisfies $\beta(2v, 2w) = 4\beta(v, w)$.`,
      caption: String.raw`Here $V = \mathbf R^2$, $W = \mathbf R^3$ and $\beta(v, w) = v^{\mathsf T} C w$ for a fixed $2\times3$ matrix $C$. **Left:** drag $v$. The colours show the function $v \mapsto \beta(v, w)$ for the current $w$ (blue positive, red negative): straight, parallel, evenly spaced level lines with the $0$-line through the origin — a linear functional on $\mathbf R^2$; the orange arrow $Cw$ is its gradient. **Right:** drag $w$ (drag the background to rotate). The three planes are where $w \mapsto \beta(v, w)$ equals $-1$, $0$, $1$: parallel, evenly spaced, the $0$-plane through the origin and perpendicular to the blue arrow $C^{\mathsf T}v$. Switch to one of the other three functions to watch bilinearity fail — level sets that miss the origin, that ignore the other slot, or that come in uneven pairs.`,
      deps: ['ladr-3.110'],
      see: ['ladr-9.1'],
      tags: ['tensors', 'bilinear'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bilinear_form' },
      viz(v) {
        const C = [[1, -0.6, 0.5], [0.4, 0.9, -0.8]], Ct = transp(C);
        const kind = v.select('', [
          { value: 'bil', label: 'bilinear: $v^{\\mathsf T}Cw$' },
          { value: 'aff', label: '$v^{\\mathsf T}Cw + 1$' },
          { value: 'lin', label: '$v_1 + w_1$' },
          { value: 'sq', label: '$(v^{\\mathsf T}Cw)^2$' },
        ], 'bil');
        const L = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 340, title: 'slot 1: $v \\mapsto \\beta(v, w)$, with $w$ fixed' });
        const R = v.stage({ x: [-1.9, 1.9], y: [-1.75, 1.95], equal: true, axes: false, height: 340, title: 'slot 2: $w \\mapsto \\beta(v, w)$, with $v$ fixed' });
        const sc = v.scene3(R, { yaw: 0.55, pitch: 0.3, axis: 1.45, lim: 1.4 });
        const hv = L.handle(1.1, 0.7, { color: 'accent', label: '$v$' });
        const hw = sc.handle([0.6, 0.8, 0.7], { color: 'orange', label: '$w$' });
        const q = (a, b) => dot(a, mv(C, b));
        const beta = (a, b) => { const k = kind.value, s = q(a, b); return k === 'bil' ? s : k === 'aff' ? s + 1 : k === 'lin' ? a[0] + b[0] : s * s; };
        const ta = [0.7, -1.2], tb = [-0.4, 1.1, 0.9];
        let st = null;
        v.render(() => {
          const vv = [hv.x, hv.y], w = hw.p, k = kind.value;
          // ---- slot 1: a function on the plane
          const f1 = (x, y) => beta([x, y], w);
          signedHeat(v, L, f1, 3, `${k}|${w.map((t) => t.toFixed(3))}`);
          L.contour(f1, [-3, -2, -1, 1, 2, 3].filter((c) => k !== 'sq' || c > 0), { color: 'muted', width: 1, labels: true, fmt: (c) => pn(c, 0) });
          L.contour(k === 'sq' ? (x, y) => q([x, y], w) : f1, [0], { color: 'ink', width: 2.2 });
          L.axes();
          const g = k === 'bil' || k === 'aff' ? mv(C, w) : k === 'lin' ? [1, 0] : null;
          if (g && len(g) > 0.05) { L.arrow(0, 0, g[0], g[1], { color: 'orange', width: 2.4, head: 9 }); L.tex(k === 'lin' ? '\\nabla' : 'Cw', g[0], g[1], { dx: g[0] >= 0 ? 16 : -16, dy: -10, color: 'orange', size: 14 }); }
          L.arrow(0, 0, vv[0], vv[1], { color: 'accent', width: 2.6, head: 9 });
          // ---- slot 2: level planes of w ↦ β(v, w) in R³
          const n = k === 'lin' ? [1, 0, 0] : mv(Ct, vv), nn = len(n);
          const planes = []; // [d, colour]: the plane n·x = d
          if (nn > 1e-6) {
            if (k === 'bil') planes.push([-1, 'red'], [0, 'ink'], [1, 'blue']);
            else if (k === 'aff') planes.push([-2, 'red'], [-1, 'ink'], [0, 'blue']);
            else if (k === 'lin') planes.push([-1 - vv[0], 'red'], [-vv[0], 'ink'], [1 - vv[0], 'blue']);
            else planes.push([-1, 'blue'], [0, 'ink'], [1, 'blue']);
          }
          sc.begin();
          const [a, b] = nn > 1e-6 ? perpPair(n) : [[1, 0, 0], [0, 1, 0]];
          for (const [d, col] of planes) {
            const c = scl(n, d / (nn * nn));
            if (len(c) < 1.75) sc.disc(a, b, 1.05, { fill: col, color: col, fillAlpha: col === 'ink' ? 0.07 : 0.12, alpha: 0.65, width: col === 'ink' ? 1.8 : 1.1 }, c);
          }
          if (k !== 'sq' && nn > 0.05) sc.arrow([0, 0, 0], scl(n, Math.min(1, 1.3 / nn)), { color: 'accent', width: 2.4 });
          sc.arrow([0, 0, 0], w, { color: 'orange', width: 2.6 });
          sc.flush();
          if (k !== 'sq' && nn > 0.05) { const P = sc.P(scl(n, Math.min(1, 1.3 / nn))); R.tex(k === 'lin' ? 'e_1' : 'C^{\\mathsf T}v', P[0], P[1], { dx: 18, dy: -6, color: 'accent', size: 14 }); }
          if (nn <= 1e-6) R.corner('β(0, ·) is the zero functional', 'tl', { color: 'muted' });
          // ---- tests: additivity and homogeneity in each slot
          const d1 = Math.max(Math.abs(beta(add(vv, ta), w) - beta(vv, w) - beta(ta, w)), Math.abs(beta(scl(vv, 2), w) - 2 * beta(vv, w)));
          const d2 = Math.max(Math.abs(beta(vv, add(w, tb)) - beta(vv, w) - beta(vv, tb)), Math.abs(beta(vv, scl(w, 2)) - 2 * beta(vv, w)));
          st = { val: beta(vv, w), d1, d2, k };
        });
        v.legend([['blue', 'value $> 0$'], ['red', 'value $< 0$'], ['ink', 'value $0$']]);
        v.readout(() => {
          if (!st) return '';
          const ok1 = st.d1 < 1e-9, ok2 = st.d2 < 1e-9;
          const why = {
            bil: String.raw`**bilinear**. Its values on basis pairs, $\beta(e_j, f_k) = C_{j,k}$, determine it (9.70).`,
            aff: String.raw`**not bilinear**: $\beta(0, w) = 1 \ne 0$, so each slot is affine, not linear — every level set misses the origin by the same shift.`,
            lin: String.raw`**not bilinear**: $v_1 + w_1$ is a linear functional on the product space $V \times W$, a different notion; the slot-2 planes do not even turn when $v$ moves.`,
            sq: String.raw`**not bilinear**: $\beta(2v, w) = 4\beta(v, w)$; the level sets come in pairs, unevenly spaced.`,
          }[st.k];
          return `$\\beta(v, w) = ${tn(st.val, 3)}$. Linearity defects (additivity and $\\beta(2v,w) - 2\\beta(v,w)$): slot 1 $= ${tn(st.d1, 3)}$ ${mark(ok1)}, slot 2 $= ${tn(st.d2, 3)}$ ${mark(ok2)} — ${why}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.70
    {
      num: '9.70',
      kind: 'Theorem',
      name: 'Dimension of the space of bilinear functionals',
      statement: String.raw`Suppose $V$ and $W$ are finite-dimensional. Then
$$\dim \mathcal B(V, W) = (\dim V)(\dim W).$$`,
      idea: String.raw`Choose bases $e_1, \dots, e_m$ of $V$ and $f_1, \dots, f_n$ of $W$. Sending $\beta$ to the $m$-by-$n$ matrix $\mathcal M(\beta)$ with entries $\beta(e_j, f_k)$ is linear, and it has an inverse: a matrix $C$ goes to the bilinear functional $\beta_C\big(\sum_j a_j e_j, \sum_k b_k f_k\big) = \sum_{j,k} C_{j,k}\, a_j b_k$. Bilinearity is exactly what makes $\beta$ determined by its $mn$ values on basis pairs. So $\mathcal B(V, W) \cong \mathbf F^{m,n}$, and $\dim \mathbf F^{m,n} = mn$ (3.40, 3.70). The elementary functionals $(v, w) \mapsto a_j b_k$ (the coordinate products) form a basis. Compare $\dim (V \times W)' = m + n$: linear functionals on the product space are a much smaller family.`,
      caption: String.raw`Pick $m = \dim V$ and $n = \dim W$. **Left:** the $mn$ elementary bilinear functionals $\varepsilon_{j,k}(v, w) = v_j w_k$, one per cell. **Right:** a numerical dimension count that assumes nothing: 24 random bilinear functionals are evaluated at 24 random pairs $(v, w)$, and the singular values of the resulting $24\times24$ table are plotted on a log scale. The span of the functionals has dimension equal to the number of singular values that are not rounding noise: the cliff sits exactly at $mn$. Switch to *linear functionals on $V \times W$* for comparison: the cliff moves to $m + n$.`,
      deps: ['ladr-9.68', 'ladr-3.40', 'ladr-3.70'],
      see: ['ladr-9.5'],
      tags: ['tensors', 'dimension'],
      viz(v) {
        const M = v.M;
        const sm = v.slider('$m = \\dim V$', 1, 4, 2, { int: true });
        const sn = v.slider('$n = \\dim W$', 1, 4, 3, { int: true });
        const fam = v.select('', [{ value: 'bil', label: 'bilinear functionals on $V \\times W$' }, { value: 'lin', label: 'linear functionals on $V \\times W$ (compare)' }], 'bil');
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, weight: 0.85, minWidth: 260 });
        const B = v.stage({ x: [0.2, 24.8], y: [1e-18, 1e3], ylog: true, axes: 'box', height: 320, weight: 1.15, minWidth: 300, xticks: [1, 4, 8, 12, 16, 20, 24], xlabel: 'index $i$', ylabel: '$\\sigma_i$', title: 'singular values of 24 functionals × 24 random pairs' });
        const T = v.table(A, { rows: 2, cols: 3, maxCell: 62, size: 14, region: [0.05, 0.22, 0.95, 0.84] });
        let memo = null;
        const run = (m, n, k) => {
          const key = `${m}|${n}|${k}`; if (memo && memo.key === key) return memo;
          const r = v.rng(11 + 7 * m + 31 * n), N = 24, F = 24, g = () => r.normal();
          const vec = (d) => Array.from({ length: d }, g);
          const P = Array.from({ length: N }, () => [vec(m), vec(n)]);
          const fs = Array.from({ length: F }, () => (k === 'bil' ? Array.from({ length: m }, () => vec(n)) : [vec(m), vec(n)]));
          const tab = P.map(([x, y]) => fs.map((f) => (k === 'bil' ? dot(x, mv(f, y)) : dot(f[0], x) + dot(f[1], y))));
          const s = M.svd(tab).S, E = P.map(([x, y]) => (k === 'bil' ? outer(x, y).flat() : [...x, ...y])), se = M.svd(E).S;
          return (memo = { key, s, rank: nrank(s), re: nrank(se) });
        };
        let st = null;
        v.render(() => {
          const m = sm.value, n = sn.value, k = fam.value, Rr = run(m, n, k), d = k === 'bil' ? m * n : m + n;
          // ---- left: the elementary functionals
          if (k === 'bil') T.draw({ rows: m, cols: n, value: (i, j) => `$v_{${i + 1}}w_{${j + 1}}$`, fill: () => ['blue', 0.16], size: m * n > 9 ? 12.5 : 14 });
          else T.draw({ rows: 1, cols: m + n, value: (i, j) => (j < m ? `$v_{${j + 1}}$` : `$w_{${j - m + 1}}$`), fill: (i, j) => [j < m ? 'blue' : 'orange', 0.18] });
          const gm = T.geo;
          if (gm) A.texPx(k === 'bil' ? '\\varepsilon_{j,k}(v, w) = v_j\\, w_k' : '(v, w) \\mapsto v_j \\ \\text{or}\\ w_k', gm.X0 + (gm.cols * gm.cw) / 2, gm.Y0 - 18, { size: 14 });
          A.texPx(k === 'bil' ? `m \\cdot n = ${m} \\cdot ${n} = ${m * n}` : `m + n = ${m} + ${n} = ${m + n}`, A.width / 2, A.height - 26, { size: 17, color: k === 'bil' ? 'blue' : 'orange' });
          // ---- right: the singular-value cliff
          B.hband(1e-18, 1e-12, { color: 'faint', alpha: 0.18 });
          Rr.s.forEach((s, i) => B.rect(i + 1 - 0.36, 1e-18, i + 1 + 0.36, Math.max(s, 2e-18), { fill: i < Rr.rank ? (k === 'bil' ? 'blue' : 'orange') : 'muted', fillAlpha: i < Rr.rank ? 0.75 : 0.35, stroke: false }));
          B.vline(Rr.rank + 0.5, { color: 'green', width: 2, dash: [6, 4] });
          B.text(`rank = ${Rr.rank}`, Rr.rank + 0.9, 3e1, { color: 'green', size: 13, weight: 700 });
          B.text('rounding noise', 23.6, 3e-14, { color: 'muted', size: 11.5, align: 'right' });
          st = { m, n, k, d, ...Rr };
        });
        v.readout(() => {
          if (!st) return '';
          const { m, n, k, s, rank, re } = st;
          const cliff = `$\\sigma_{${rank}} = ${M.sci(s[rank - 1], 2)}$, then $\\sigma_{${rank + 1}} = ${M.sci(Math.max(s[rank] ?? 0, 1e-300), 2)}$`;
          if (k === 'bil') return `Numerical rank of the table: **${rank}** $= ${m}\\cdot${n} = (\\dim V)(\\dim W)$ (${cliff}). The ${m * n} elementary functionals alone already give rank ${re}: they are independent and span everything the random functionals reach — a basis of $\\mathcal B(V, W)$.`;
          return `Linear functionals on $V \\times W$ give rank **${rank}** $= ${m} + ${n}$ (${cliff}) — the dimension of $(V \\times W)'$ (3.92, 3.111). ${m >= 2 && n >= 2 ? `For $m, n \\ge 2$ that is smaller than $mn = ${m * n}$.` : 'With a one-dimensional factor, $m + n$ is the larger count.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.71
    {
      num: '9.71',
      kind: 'Definition',
      name: 'Tensor product V ⊗ W',
      statement: String.raw`Suppose $V$ and $W$ are finite-dimensional.
- The **tensor product** $V \otimes W$ is the vector space $\mathcal B(V', W')$ of bilinear functionals on $V' \times W'$.
- For $v \in V$ and $w \in W$, the **tensor product** $v \otimes w \in V \otimes W$ is the bilinear functional on $V' \times W'$ given by
$$(v \otimes w)(\varphi, \tau) = \varphi(v)\,\tau(w) \qquad \text{for all } \varphi \in V',\ \tau \in W'.$$`,
      idea: String.raw`We want a product of $v \in V$ with $w \in W$ that is bilinear and lives in a space of dimension $(\dim V)(\dim W)$; the product space $V \times W$ has the wrong dimension, $\dim V + \dim W$. The spaces $\mathcal B(V, W)$, $\mathcal L(V, W)$ and $\mathbf F^{m,n}$ have the right dimension, but none of them offers a basis-free formula for $v \otimes w$. Using the duals does: $\varphi(v)\tau(w)$ needs no basis, and it is bilinear in $(\varphi, \tau)$ (9.69). In coordinates (Axler's example 9.76), with standard bases of $\mathbf F^m$ and $\mathbf F^n$, $v \otimes w$ has coefficients $v_j w_k$; written as an $m$-by-$n$ matrix this is the rank-one matrix $v w^{\mathsf T}$, and its value at $(\varphi, \tau)$ is $\varphi^{\mathsf T}(v w^{\mathsf T})\tau$.`,
      caption: String.raw`$V = \mathbf R^2$, $W = \mathbf R^3$. Drag the bar tips: $v$ (left, blue) and $w$ (top, orange) fill the grid with their **multiplication table** $v_j w_k$ — the array of $v \otimes w$. Every row is a multiple of $w$ and every column a multiple of $v$; right, the singular values show it: $\sigma_1 = \|v\|\,\|w\|$ and $\sigma_2 = 0$, rank one. The purple bars $\varphi \in V'$ (right) and teal bars $\tau \in W'$ (bottom) are a pair of functionals that $v \otimes w$ eats; the readout checks $(v \otimes w)(\varphi, \tau) = \varphi(v)\tau(w) = \sum_{j,k}\varphi_j\tau_k\, v_j w_k$. Set $\varphi = (1, 0)$, $\tau = (0, 1, 0)$ to read off one cell. Switch on *perturb one entry* to get an array that is no longer $v \otimes w$ for any $v, w$.`,
      deps: ['ladr-9.68', 'ladr-3.110'],
      tags: ['tensors'],
      credit: 'H. Whitney, 1938',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Tensor_product' },
      viz(v) {
        const M = v.M;
        const V = [1.2, -0.7], W = [0.8, 1.5, -1.1], PH = [1, 0.5], TA = [0.6, -0.4, 1];
        const pert = v.toggle('perturb one entry (+0.5 at row 2, column 3)', false);
        const S = v.stage({ x: [-3.1, 6.0], y: [-4.75, 2.75], equal: true, axes: false, height: 380, weight: 1.35, minWidth: 330 });
        const G = v.stage({ x: [0, 3], y: [0, 5.2], axes: false, height: 380, weight: 0.65, minWidth: 190, title: 'singular values of the array' });
        const bv = bars(S, V, { orient: 'h', pos: [-0.5, -1.5], zero: -1.25, sc: 0.42, lim: 2, color: 'blue' });
        const bw = bars(S, W, { orient: 'v', pos: [0.5, 1.5, 2.5], zero: 1.25, sc: 0.42, lim: 2, color: 'orange' });
        const bp = bars(S, PH, { orient: 'h', pos: [-0.5, -1.5], zero: 4.25, sc: 0.42, lim: 2, color: 'purple', side: 'right' });
        const bt = bars(S, TA, { orient: 'v', pos: [0.5, 1.5, 2.5], zero: -3.25, sc: 0.42, lim: 2, color: 'teal', side: 'bottom' });
        let st = null;
        v.render(() => {
          const X = outer(V, W);
          if (pert.value) X[1][2] += 0.5;
          bv.draw(); bw.draw(); bp.draw(); bt.draw();
          grid(S, X, 0, 0, 1, { scale: 4, hl: pert.value ? [[1, 2, 'red']] : [] });
          S.tex('v', -1.25, -2.35, { color: 'blue', size: 17 });
          S.tex('w', -0.35, 1.25, { color: 'orange', size: 17 });
          S.tex('\\varphi', 4.25, 0.35, { color: 'purple', size: 17 });
          S.tex('\\tau', 3.4, -3.25, { color: 'teal', size: 17 });
          S.tex(pert.value ? 'v \\otimes w + \\tfrac12\\, e_2 \\otimes f_3' : 'v \\otimes w', 1.5, -2.3, { color: pert.value ? 'red' : 'ink', size: 15, baseline: 'top' });
          // singular values
          const s = M.svd(X).S, top = Math.max(4, s[0] * 1.15);
          G.setView([0, 3], [-0.75, top]);
          G.hline(0, { color: 'muted', width: 1 });
          s.forEach((x, i) => {
            const col = i === 0 ? 'blue' : x > 1e-9 ? 'red' : 'green';
            G.rect(0.75 + i * 1.1 - 0.32, 0, 0.75 + i * 1.1 + 0.32, Math.max(x, 0), { fill: col, fillAlpha: 0.7, color: col, width: 1.2 });
            G.text(pn(x, 3), 0.75 + i * 1.1, Math.max(x, 0), { dy: -11, align: 'center', size: 12, color: col, weight: 600 });
            G.tex(`\\sigma_${i + 1}`, 0.75 + i * 1.1, 0, { dy: 13, size: 14, color: 'ink' });
          });
          G.corner(s[1] < 1e-9 ? 'rank 1: a simple tensor' : 'rank 2: not of the form v ⊗ w', 'tl', { color: s[1] < 1e-9 ? 'green' : 'red', weight: 700 });
          const pv = dot(PH, V), tw = dot(TA, W), ev = dot(PH, mv(X, TA));
          st = { pv, tw, ev, s, nv: len(V) * len(W) };
        });
        v.readout(() => {
          if (!st) return '';
          const { pv, tw, ev, s, nv } = st, ok = Math.abs(ev - pv * tw) < 1e-9;
          const sv = s[1] < 1e-9 ? `$\\sigma_1 = ${tn(s[0], 3)} = \\|v\\|\\,\\|w\\|$ and $\\sigma_2 = ${etx(M, s[1])}$: rank one, as every $v \\otimes w$ must be.` : `$\\sigma_2 = ${tn(s[1], 3)} > 0$: rank two, so this array is **not** $v' \\otimes w'$ for any $v', w'$ (a simple tensor always has rank $\\le 1$).`;
          return `$\\varphi(v)\\,\\tau(w) = ${tn(pv, 3)} \\times ${tn(tw, 3)} = ${tn(pv * tw, 3)}$ and $\\sum_{j,k} \\varphi_j \\tau_k X_{j,k} = ${tn(ev, 3)}$ ${mark(ok)}${ok ? '' : ' — the perturbed array is a different functional'}. ${sv}${s[1] < 1e-9 ? '' : ` (Unperturbed, $\\sigma_1$ would be $\\|v\\|\\|w\\| = ${tn(nv, 3)}$.)`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.72
    {
      num: '9.72',
      kind: 'Theorem',
      name: 'Dimension of the tensor product of two spaces',
      statement: String.raw`Suppose $V$ and $W$ are finite-dimensional. Then
$$\dim(V \otimes W) = (\dim V)(\dim W).$$`,
      idea: String.raw`By definition $V \otimes W = \mathcal B(V', W')$. A space and its dual have the same dimension (3.111), so $\dim V' = \dim V$ and $\dim W' = \dim W$, and 9.70 gives $\dim \mathcal B(V', W') = (\dim V')(\dim W') = (\dim V)(\dim W)$. Contrast the product space: $\dim(V \times W) = \dim V + \dim W$ (3.92). The tensor product is the space whose dimension *multiplies*.`,
      caption: String.raw`Pick $m = \dim V$, $n = \dim W$. Each tile is a random simple tensor $v \otimes w$, drawn as its $m \times n$ array; press *add a random element* for more. A green frame means the new element raised the dimension of the span, a grey one that it was already a combination of the earlier ones. The staircase (right) plots the dimension of the span: it climbs one step per element and stops exactly at $mn$ — simple tensors span all of $V \otimes W$, and no more than $mn$ of them are ever independent. Switch to $V \times W$: the pairs $(v, w)$, drawn as $m + n$ cells, stop at $m + n$.`,
      deps: ['ladr-3.111', 'ladr-9.70', 'ladr-9.71'],
      see: ['ladr-3.92'],
      tags: ['tensors', 'dimension'],
      viz(v) {
        const M = v.M;
        const sm = v.slider('$m = \\dim V$', 1, 4, 2, { int: true });
        const sn = v.slider('$n = \\dim W$', 1, 4, 3, { int: true });
        const sp = v.select('', [{ value: 'ten', label: '$V \\otimes W$: arrays $v\\,w^{\\mathsf T}$' }, { value: 'prod', label: '$V \\times W$: pairs $(v, w)$' }], 'ten');
        const MAX = 20;
        let gen = null, count = null, extra = 0;
        const regen = (m, n) => {
          const r = v.rng(5 + 13 * m + 41 * n), list = [];
          for (let i = 0; i < 40; i++) list.push([Array.from({ length: m }, () => r1(r.normal())), Array.from({ length: n }, () => r1(r.normal()))]);
          gen = { m, n, list }; count = Math.min(MAX, Math.max(m * n, m + n) + 3); extra = 0;
        };
        v.button('add a random element', () => { if (count < MAX) count++; else extra++; });
        v.button('start over', () => { count = 0; extra = 0; });
        const Gs = v.stage({ x: [0, 20], y: [-0.25, 4.45], equal: true, axes: false, height: 210, full: true, title: 'the list, one tile per element (green frame = raised the dimension)' });
        const P = v.stage({ x: [0, 20.6], y: [0, 17.6], axes: 'box', height: 260, full: true, xlabel: 'number of elements in the list', ylabel: 'dim of span', xticks: [0, 4, 8, 12, 16, 20], yticks: [0, 4, 8, 12, 16] });
        let st = null;
        v.render(() => {
          const m = sm.value, n = sn.value, ten = sp.value === 'ten';
          if (!gen || gen.m !== m || gen.n !== n) regen(m, n);
          const els = gen.list.slice(extra, extra + count), vecs = els.map(([a, b]) => (ten ? outer(a, b).flat() : [...a, ...b]));
          const dims = [0];
          for (let i = 1; i <= els.length; i++) dims.push(nrank(M.svd(vecs.slice(0, i)).S));
          const target = ten ? m * n : m + n;
          // ---- tiles
          els.forEach(([a, b], i) => {
            const row = Math.floor(i / 10), col = i % 10, x0 = col * 2 + 0.2, y0 = 4.25 - row * 2.25, up = dims[i + 1] > dims[i];
            S1(Gs, x0, y0, up);
            if (ten) { const c = Math.min(1.5 / n, 1.5 / m); grid(Gs, outer(a, b), x0 + 0.8 - (n * c) / 2, y0 - 0.85 + (m * c) / 2, c, { numbers: false, scale: 3, fw: 0.9 }); }
            else {
              const c = Math.min(1.5 / (m + n + 0.5), 0.45), w0 = x0 + 0.8 - ((m + n + 0.5) * c) / 2, yc = y0 - 0.85 + c / 2;
              grid(Gs, [a], w0, yc, c, { numbers: false, scale: 2, fw: 0.9 }); grid(Gs, [b], w0 + (m + 0.5) * c, yc, c, { numbers: false, scale: 2, fw: 0.9 });
            }
            Gs.text(String(i + 1), x0 + 0.08, y0 - 0.12, { size: 10, color: up ? 'green' : 'muted', align: 'left', baseline: 'top' });
          });
          if (!els.length) Gs.text('empty list — press “add a random element”', 10, 2.1, { align: 'center', color: 'muted', size: 13 });
          // ---- staircase
          P.hline(m * n, { color: 'blue', width: 1.6, dash: [6, 4] });
          P.hline(m + n, { color: 'orange', width: 1.6, dash: [6, 4] });
          P.text(`mn = ${m * n}`, 20.4, m * n, { dy: m * n >= m + n ? -10 : 11, align: 'right', color: 'blue', size: 12, weight: 700 });
          P.text(`m + n = ${m + n}`, 20.4, m + n, { dy: m * n >= m + n ? 11 : -10, align: 'right', color: 'orange', size: 12, weight: 700 });
          const pts = []; dims.forEach((d, i) => { if (i) pts.push([i, dims[i - 1]]); pts.push([i, d]); });
          P.path(pts, { color: ten ? 'blue' : 'orange', width: 2.8 });
          dims.forEach((d, i) => { if (i) P.dot(i, d, { r: 3.5, color: d > dims[i - 1] ? 'green' : 'muted' }); });
          st = { m, n, ten, d: dims[dims.length - 1], target, k: els.length };
        });
        /** Tile background frame. */
        function S1(Sg, x0, y0, up) { Sg.rect(x0, y0 - 1.95, x0 + 1.6, y0, { color: up ? 'green' : 'faint', width: up ? 2 : 1.2, radius: 4, fill: up ? 'green' : null, fillAlpha: 0.05 }); }
        v.readout(() => {
          if (!st) return '';
          const { m, n, ten, d, target, k } = st;
          const name = ten ? `(\\dim V)(\\dim W) = ${m}\\cdot${n}` : `\\dim V + \\dim W = ${m} + ${n}`;
          if (!k) return 'The list is empty: its span is $\\{0\\}$.';
          return `${k} element${k > 1 ? 's' : ''}, span of dimension **${d}**${d === target ? ` $= ${name}$ — the ceiling: ${ten ? 'the simple tensors span all of $V \\otimes W$' : 'the pairs span all of $V \\times W$'}, and every further element is dependent.` : ` (the ceiling is $${name} = ${target}$; add more elements).`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.73
    {
      num: '9.73',
      kind: 'Theorem',
      name: 'Bilinearity of tensor product',
      statement: String.raw`Suppose $v, v_1, v_2 \in V$, $w, w_1, w_2 \in W$ and $\lambda \in \mathbf F$. Then
$$(v_1 + v_2) \otimes w = v_1 \otimes w + v_2 \otimes w, \qquad v \otimes (w_1 + w_2) = v \otimes w_1 + v \otimes w_2,$$
$$\lambda(v \otimes w) = (\lambda v) \otimes w = v \otimes (\lambda w).$$`,
      idea: String.raw`Two elements of $V \otimes W = \mathcal B(V', W')$ are equal when they agree at every $(\varphi, \tau)$. And $\big((v_1 + v_2) \otimes w\big)(\varphi, \tau) = \varphi(v_1 + v_2)\tau(w) = \varphi(v_1)\tau(w) + \varphi(v_2)\tau(w)$ because $\varphi$ is linear — which is the value of $v_1 \otimes w + v_2 \otimes w$. The other identities follow the same way from linearity of $\varphi$ and $\tau$. A consequence that surprises at first: $v \otimes w$ does not determine $v$ and $w$, since $(2v) \otimes (\tfrac12 w) = v \otimes w$.`,
      caption: String.raw`$V = \mathbf R^2$, $W = \mathbf R^3$; each grid is the multiplication table of the bars beside and above it. *Additivity*: drag $v_1$, $v_2$ and $w$ (bar tips on the first two tables); the third table, built from $v_1 + v_2$, is the cell-by-cell sum of the first two. *Scalars*: drag $v$ and $w$ and move $\lambda$; the middle table uses $\lambda v$ and $w/\lambda$ — different bars, **the same table** — and the right one uses $\lambda v$ and $w$, giving $\lambda$ times the first. Switch the operation to $+$ (a table of sums $v_j + w_k$, which is how a pair $(v, w) \in V \times W$ would behave) to see both identities fail.`,
      deps: ['ladr-9.71'],
      tags: ['tensors'],
      viz(v) {
        const mode = v.select('', [{ value: 'add', label: 'additivity: $(v_1 + v_2)\\otimes w$' }, { value: 'scal', label: 'scalars: $(\\lambda v)\\otimes(w/\\lambda)$' }], 'scal');
        const op = v.select('table entries', [{ value: 'mul', label: '$v_j\\,w_k$ (tensor)' }, { value: 'sum', label: '$v_j + w_k$ (break)' }], 'mul');
        const lam = v.slider('$\\lambda$', 0.25, 4, 2, { log: true, sig: 2 });
        const S = v.stage({ x: [-0.4, 18.4], y: [-3.2, 3.1], equal: true, axes: false, height: 330, full: true });
        const V1 = [1, -0.6], V2 = [-0.4, 1.2], W = [1.2, 0.5, -0.8];
        const X0 = [1.9, 8.1, 14.3], c = 1, lim = 2, sc = 0.32;
        const mk = (vals, gi, edit, color) => bars(S, vals, { orient: 'h', pos: [-0.5, -1.5], zero: X0[gi] - 0.95, sc, lim, color, edit, cell: c });
        const mkw = (vals, gi, edit) => bars(S, vals, { orient: 'v', pos: [0.5, 1.5, 2.5].map((p) => X0[gi] + p), zero: 1.05, sc, lim, color: 'orange', edit, cell: c });
        const b1 = mk(V1, 0, true, 'blue'), b2 = mk(V2, 1, true, 'purple'), w1 = mkw(W, 0, true);
        const d2 = mk([0, 0], 1, false, 'blue'), d3 = mk([0, 0], 2, false, 'blue'), dw2 = mkw([0, 0, 0], 1, false), dw3 = mkw([0, 0, 0], 2, false);
        const tab = (a, b) => (op.value === 'mul' ? outer(a, b) : a.map((x) => b.map((y) => x + y)));
        let st = null;
        v.render(() => {
          const add_ = mode.value === 'add', L = lam.value;
          lam.el.hidden = add_;
          b2.show(add_);
          let G1, G2, G3, vecs;
          if (add_) {
            const s12 = add(V1, V2);
            G1 = tab(V1, W); G2 = tab(V2, W); G3 = tab(s12, W);
            vecs = [[V1, 'blue', 'v_1'], [V2, 'purple', 'v_2'], [s12, 'teal', 'v_1 + v_2']];
            b1.draw(); w1.draw(); b2.draw(); d3.draw(s12, { color: 'teal' }); dw2.draw(W); dw3.draw(W);
          } else {
            const lv = scl(V1, L), wl = scl(W, 1 / L);
            G1 = tab(V1, W); G2 = tab(lv, wl); G3 = tab(lv, W);
            vecs = [[V1, 'blue', 'v'], [lv, 'teal', '\\lambda v'], [lv, 'teal', '\\lambda v']];
            b1.draw(); w1.draw(); d2.draw(lv, { color: 'teal', dec: 2 }); dw2.draw(wl, { dec: 2 }); d3.draw(lv, { color: 'teal', dec: 2 }); dw3.draw(W);
          }
          const scale = Math.max(2, maxAbs([G1, G2, G3]));
          const want3 = add_ ? madd(G1, G2) : mscl(G1, L), want2 = G1;
          const bad3 = [], bad2 = [];
          for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) { if (Math.abs(G3[i][j] - want3[i][j]) > 1e-9) bad3.push([i, j, 'red']); if (!add_ && Math.abs(G2[i][j] - want2[i][j]) > 1e-9) bad2.push([i, j, 'red']); }
          [G1, G2, G3].forEach((Gk, gi) => grid(S, Gk, X0[gi], 0, c, { scale, hl: gi === 2 ? bad3 : gi === 1 ? bad2 : [] }));
          // labels under the tables, and the relations between them
          const sym = op.value === 'mul' ? '\\otimes' : '\\boxplus';
          const wl = add_ ? ['w', 'w', 'w'] : ['w', 'w/\\lambda', 'w'];
          vecs.forEach(([, col, nm], gi) => S.tex(`${nm} ${sym} ${wl[gi]}`, X0[gi] + 1.5, -2.45, { color: col === 'purple' ? 'purple' : col === 'teal' ? 'teal' : 'blue', size: 15 }));
          if (add_) {
            S.tex('+', (X0[0] + 3 + X0[1] - 1.9) / 2 - 0.05, -1, { size: 26, color: 'ink' });
            S.tex(bad3.length ? '\\ne' : '=', (X0[1] + 3 + X0[2] - 1.9) / 2 - 0.05, -1, { size: 26, color: bad3.length ? 'red' : 'green' });
          } else {
            S.tex(bad2.length ? '\\ne' : '=', (X0[0] + 3 + X0[1] - 1.9) / 2 - 0.05, -1, { size: 26, color: bad2.length ? 'red' : 'green' });
            S.tex(bad3.length ? `\\ne \\lambda\\,\\cdot` : `= \\lambda\\,\\cdot`, X0[2] + 1.5, -3.0, { size: 13, color: bad3.length ? 'red' : 'green' });
            S.tex(`\\text{first table}`, X0[2] + 1.5, -3.0, { size: 13, color: 'muted', dx: 62 });
          }
          const err3 = maxAbs(msub(G3, want3)), err2 = add_ ? 0 : maxAbs(msub(G2, want2));
          st = { add_, err2, err3, L, mul: op.value === 'mul' };
        });
        v.readout(() => {
          if (!st) return '';
          const { add_, err2, err3, L, mul } = st;
          if (add_) return mul ? `Largest difference between the table of $v_1 + v_2$ and the sum of the first two tables: $${tn(err3, 6)}$ ✓ — additivity in the first slot.` : `With entries $v_j + w_k$ the third table differs from the sum of the first two by up to $${tn(err3, 3)}$ ✗: the sum table counts $w$ twice. Pairs $(v, w)$ are not bilinear.`;
          return mul ? `$\\lambda = ${tn(L, 2)}$: the tables of $(\\lambda v)\\otimes(w/\\lambda)$ and $v \\otimes w$ differ by $${tn(err2, 6)}$ ✓, and $(\\lambda v)\\otimes w - \\lambda(v\\otimes w)$ is $${tn(err3, 6)}$ ✓ — a scalar moves freely between the factors, so $v \\otimes w$ forgets how its length is split between $v$ and $w$.` : `With entries $v_j + w_k$: rescaling to $(\\lambda v, w/\\lambda)$ changes the table by up to $${tn(err2, 3)}$ ${mark(err2 < 1e-9)}, and $(\\lambda v, w)$ is off from $\\lambda$ times the first table by $${tn(err3, 3)}$ ${mark(err3 < 1e-9)}${Math.abs(L - 1) < 1e-9 ? ' (at $\\lambda = 1$ nothing can fail)' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.74
    {
      num: '9.74',
      kind: 'Theorem',
      name: 'Basis of V ⊗ W',
      statement: String.raw`Suppose $e_1, \dots, e_m$ is a list in $V$ and $f_1, \dots, f_n$ is a list in $W$.
(a) If both lists are linearly independent, then the list $\{e_j \otimes f_k\}_{j = 1, \dots, m;\ k = 1, \dots, n}$ is linearly independent in $V \otimes W$.
(b) If $e_1, \dots, e_m$ is a basis of $V$ and $f_1, \dots, f_n$ is a basis of $W$, then $\{e_j \otimes f_k\}_{j = 1, \dots, m;\ k = 1, \dots, n}$ is a basis of $V \otimes W$.`,
      idea: String.raw`For (a), the linear map lemma (3.4) supplies functionals $\varphi_1, \dots, \varphi_m \in V'$ and $\tau_1, \dots, \tau_n \in W'$ with $\varphi_j(e_M) = \delta_{jM}$ and $\tau_k(f_N) = \delta_{kN}$ (possible because the lists are independent). Then $(e_j \otimes f_k)(\varphi_M, \tau_N)$ is $1$ when $(j, k) = (M, N)$ and $0$ otherwise, so applying a vanishing combination $\sum a_{j,k}\, e_j \otimes f_k = 0$ to $(\varphi_M, \tau_N)$ isolates $a_{M,N} = 0$. Part (b) follows: $mn$ independent vectors in a space of dimension $mn$ (9.72) form a basis (2.38). So every tensor is a finite sum of simple tensors — but usually not a single one: for $\mathbf F^m \otimes \mathbf F^n$ the fewest simple terms needed is the rank of the array.`,
      caption: String.raw`$V = \mathbf R^2$ with a basis $e_1, e_2$ you can drag (left), $W = \mathbf R^3$ with a basis $f_1, f_2, f_3$ you can drag (middle; drag the background to rotate). Below: the six arrays $e_j \otimes f_k$, each scaled by the coefficient $a_{j,k}$ that the target tensor $A$ needs; their sum rebuilds $A$ exactly, whatever bases you choose. Switch on *break: $e_2 = \tfrac12 e_1$* (or drag the $f$'s into a plane): the six arrays then span only a smaller space, the rebuilt array misses $A$, and the readout shows rank of the list $= \operatorname{rank}(e) \cdot \operatorname{rank}(f)$. Note that $A$ itself has rank 2 — a combination of simple tensors that is not a simple tensor.`,
      deps: ['ladr-9.71', 'ladr-3.4', 'ladr-9.72', 'ladr-2.38'],
      tags: ['tensors', 'bases'],
      viz(v) {
        const M = v.M;
        const brk = v.toggle('break: $e_2 = \\tfrac12 e_1$', false);
        let seed = 3, A = [[1.2, -0.5, 0.8], [0.3, 1.0, -0.9]];
        v.button('new target A', () => { const r = v.rng(++seed); A = [0, 1].map(() => [0, 1, 2].map(() => r1(r.uniform(-1.4, 1.4)))); });
        const E = v.stage({ x: [-1.7, 1.7], y: [-1.5, 1.7], equal: true, height: 270, weight: 0.8, minWidth: 220, title: 'basis of $V = \\mathbf R^2$' });
        const F = v.stage({ x: [-1.8, 1.8], y: [-1.5, 1.8], equal: true, axes: false, height: 270, weight: 1, minWidth: 250, title: 'basis of $W = \\mathbf R^3$' });
        const T = v.stage({ x: [-0.2, 16.2], y: [-0.55, 4.3], equal: true, axes: false, height: 250, full: true });
        const sc = v.scene3(F, { yaw: 0.6, pitch: 0.32, axis: 1.35, lim: 1.5 });
        const he = [E.handle(1.1, 0.25, { color: 'blue', label: '$e_1$' }), E.handle(-0.3, 1.0, { color: 'purple', label: '$e_2$' })];
        const FC = ['orange', 'pink', 'teal'];
        const hf = [[1.05, 0.15, -0.1], [0.2, 1.0, 0.25], [-0.15, 0.25, 1.05]].map((p, k) => sc.handle(p, { color: FC[k], label: `$f_${k + 1}$` }));
        let st = null;
        v.render(() => {
          he[1].visible = !brk.value;
          const e1 = [he[0].x, he[0].y], e2 = brk.value ? scl(e1, 0.5) : [he[1].x, he[1].y], es = [e1, e2], fs = hf.map((h) => h.p);
          const Em = fromCols(es), Fm = fromCols(fs), dE = M.det(Em), dF = M.det(Fm);
          // ---- V and W pictures
          E.arrow(0, 0, e1[0], e1[1], { color: 'blue', width: 2.8 }); E.arrow(0, 0, e2[0], e2[1], { color: 'purple', width: 2.8 });
          if (brk.value) E.tex('e_2 = \\tfrac12 e_1', e2[0], e2[1], { dx: 30, dy: 14, color: 'purple', size: 14 });
          E.corner(`det = ${pn(dE, 2)}`, 'tl', { color: Math.abs(dE) > 1e-3 ? 'green' : 'red', weight: 700 });
          sc.begin(); fs.forEach((f, k) => sc.arrow([0, 0, 0], f, { color: FC[k], width: 2.8 })); sc.flush();
          F.corner(`det = ${pn(dF, 2)}`, 'tl', { color: Math.abs(dF) > 1e-3 ? 'green' : 'red', weight: 700 });
          // ---- coefficients: A ≈ E a Fᵀ (least squares through pseudo-inverses)
          const a = mm(mm(M.pinv(Em), A), transp(M.pinv(Fm))), Rb = mm(mm(Em, a), transp(Fm)), res = maxAbs(msub(Rb, A));
          const K = [], rows = [];
          for (let j = 0; j < 2; j++) for (let k = 0; k < 3; k++) rows.push(outer(es[j], fs[k]).flat());
          const rk = nrank(M.svd(rows).S), rE = nrank(M.svd(Em).S), rF = nrank(M.svd(Fm).S), sA = M.svd(A).S;
          // ---- tiles e_j ⊗ f_k scaled by a_{jk}
          const c = 0.42, scale = Math.max(1, maxAbs(A), ...[0, 1].flatMap((j) => [0, 1, 2].map((k) => maxAbs(mscl(outer(es[j], fs[k]), a[j][k])))));
          for (let j = 0; j < 2; j++) for (let k = 0; k < 3; k++) {
            const x0 = 0.1 + k * 1.75, y0 = 3.55 - j * 1.95, tile = mscl(outer(es[j], fs[k]), a[j][k]);
            grid(T, tile, x0, y0, c, { numbers: false, scale, fw: 1 });
            T.tex(`${tn(a[j][k], 2)}\\; e_${j + 1}\\!\\otimes\\! f_${k + 1}`, x0 + 1.5 * c, y0 + 0.08, { size: 12.5, baseline: 'bottom', color: 'ink' });
          }
          T.tex('\\sum_{j,k} a_{j,k}\\, e_j \\otimes f_k', 6.15, 4.15, { size: 13, color: 'muted', align: 'left' });
          T.tex('\\longrightarrow', 6.45, 1.55, { size: 24, color: 'muted' });
          const gR = grid(T, Rb, 7.1, 2.75, 1, { scale });
          T.tex('\\text{rebuilt}', gR.cx, 3.05, { size: 13, color: res < 1e-9 ? 'green' : 'red', baseline: 'bottom' });
          T.tex(res < 1e-9 ? '=' : '\\ne', 10.75, 1.75, { size: 28, color: res < 1e-9 ? 'green' : 'red' });
          const gA = grid(T, A, 11.6, 2.75, 1, { scale });
          T.tex('A', gA.cx, 3.05, { size: 16, baseline: 'bottom' });
          T.tex(`\\operatorname{rank} A = ${nrank(sA)}`, gA.cx, 0.45, { size: 13, color: 'muted', baseline: 'top' });
          st = { rk, rE, rF, res, rA: nrank(sA), s2: sA[1] };
        });
        v.readout(() => {
          if (!st) return '';
          const { rk, rE, rF, res, rA } = st;
          const ok = rk === 6;
          return `Rank of the list $\\{e_j \\otimes f_k\\}$: **${rk}** $= ${rE} \\cdot ${rF}$ (rank of the $e$'s times rank of the $f$'s). ${ok ? `A basis: the coefficients $a_{j,k}$ are unique and rebuild $A$ to within $${etx(M, res)}$ ✓.` : `Not a basis: the six arrays span only a ${rk}-dimensional space, and the best combination misses $A$ by $${tn(res, 3)}$ ✗.`} ${rA > 1 ? `And $A$ has rank ${rA}, so it is a sum of basis tensors but not a single simple tensor $v \\otimes w$.` : 'This $A$ has rank 1: it happens to be a simple tensor.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.77
    {
      num: '9.77',
      kind: 'Definition',
      name: 'Bilinear map',
      statement: String.raw`Suppose $V$, $W$ and $U$ are vector spaces. A **bilinear map** from $V \times W$ to $U$ is a function $\Gamma\colon V \times W \to U$ such that for each $w \in W$ the map $v \mapsto \Gamma(v, w)$ is a linear map from $V$ to $U$, and for each $v \in V$ the map $w \mapsto \Gamma(v, w)$ is a linear map from $W$ to $U$.`,
      idea: String.raw`A bilinear functional (9.68) is the case $U = \mathbf F$; now the values may be vectors. Examples: $(v, w) \mapsto v \otimes w$ from $V \times W$ to $V \otimes W$ (by 9.73); composition $(S, T) \mapsto ST$ on $\mathcal L(V) \times \mathcal L(V)$; evaluation $(v, T) \mapsto Tv$ on $V \times \mathcal L(V, W)$; and the cross product on $\mathbf R^3 \times \mathbf R^3$. Freezing one input always leaves a linear map in the other — for the cross product, $w \mapsto u \times w$ is the operator with skew-symmetric matrix $\begin{pmatrix} 0 & -u_3 & u_2 \\ u_3 & 0 & -u_1 \\ -u_2 & u_1 & 0 \end{pmatrix}$. As with functionals, bilinear is not linear on $V \times W$: $\Gamma(2v, 2w) = 4\Gamma(v, w)$.`,
      caption: String.raw`The map $\Gamma$ goes $\mathbf R^3 \times \mathbf R^3 \to \mathbf R^3$. Drag $u$ and $w$ (drag the background to rotate). The faint grid is a square of inputs in the varied slot; the green grid is its image under that slot's map with the other input frozen. For the cross product the image is again a flat grid of parallelograms, centred at $0$ — a linear map, in either slot; right, its matrix, and a check that the matrix reproduces $\Gamma(u, w)$. The other choices are linear in at most one slot: $u + w$ shifts the grid off the origin, $\|u\|\,w$ is linear in $w$ but folds in $u$, and $\langle u, w\rangle w$ is linear in $u$ but bends the grid in $w$. Try both slots.`,
      deps: ['ladr-3.1'],
      see: ['ladr-9.68'],
      tags: ['tensors', 'bilinear'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bilinear_map' },
      viz(v) {
        const Gsel = v.select('', [{ value: 'cross', label: '$u \\times w$' }, { value: 'sum', label: '$u + w$' }, { value: 'scale', label: '$\\|u\\|\\,w$' }, { value: 'quad', label: '$\\langle u, w\\rangle\\, w$' }], 'cross');
        const slot = v.select('vary', [{ value: 'w', label: 'slot 2: $w \\mapsto \\Gamma(u, w)$' }, { value: 'u', label: 'slot 1: $u \\mapsto \\Gamma(u, w)$' }], 'w');
        const S = v.stage({ x: [-2.05, 2.05], y: [-1.85, 2.0], equal: true, axes: false, height: 370, weight: 1.35, minWidth: 300 });
        const Q = v.stage({ x: [-0.1, 3.6], y: [-2.6, 2.5], equal: true, axes: false, height: 370, weight: 0.65, minWidth: 200 });
        const sc = v.scene3(S, { yaw: 0.65, pitch: 0.33, axis: 1.45, lim: 1.35 });
        const hu = sc.handle([0.5, -0.4, 1.0], { color: 'accent', label: '$u$' });
        const hw = sc.handle([0.9, 0.5, 0.1], { color: 'orange', label: '$w$' });
        const Gm = (a, b) => { const k = Gsel.value; return k === 'cross' ? cross(a, b) : k === 'sum' ? add(a, b) : k === 'scale' ? scl(b, len(a)) : scl(b, dot(a, b)); };
        const ta = [0.3, 0.8, -0.5], tb = [-0.6, 0.2, 0.7];
        let st = null;
        v.render(() => {
          const u = hu.p, w = hw.p, vw = slot.value === 'w';
          const f = vw ? (x) => Gm(u, x) : (x) => Gm(x, w);
          sc.begin();
          // the input square in the xy-plane, and its image
          const ts = [-1, -0.5, 0, 0.5, 1], N = 16, inCol = vw ? 'orange' : 'accent';
          for (const t of ts) {
            sc.line([t, -1, 0], [t, 1, 0], { color: inCol, width: 0.9, alpha: 0.35 }, 4);
            sc.line([-1, t, 0], [1, t, 0], { color: inCol, width: 0.9, alpha: 0.35 }, 4);
            const A1 = [], A2 = [];
            for (let i = 0; i <= N; i++) { const s = -1 + (2 * i) / N; A1.push(f([t, s, 0])); A2.push(f([s, t, 0])); }
            sc.path(A1, { color: 'green', width: t === 0 ? 2 : 1.3, alpha: 0.85 });
            sc.path(A2, { color: 'green', width: t === 0 ? 2 : 1.3, alpha: 0.85 });
          }
          const o = f([0, 0, 0]);
          sc.dot(o, { r: 4, color: 'green' });
          const g = Gm(u, w);
          sc.arrow([0, 0, 0], u, { color: 'accent', width: 2.6 });
          sc.arrow([0, 0, 0], w, { color: 'orange', width: 2.6 });
          if (len(g) > 1e-3) sc.arrow([0, 0, 0], g, { color: 'green', width: 3 });
          sc.flush();
          const P = sc.P(g); if (len(g) > 0.05) S.tex('\\Gamma(u,w)', P[0], P[1], { dx: 22, dy: -12, color: 'green', size: 14 });
          // ---- right: the matrix of the varied slot, from the images of e_1, e_2, e_3 minus the image of 0
          const cols = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((e) => subv(f(e), o)), Mx = fromCols(cols);
          grid(Q, Mx, 0.2, 2.0, 1, { scale: 2 });
          Q.tex(vw ? '\\text{matrix of } w \\mapsto \\Gamma(u, w)' : '\\text{matrix of } u \\mapsto \\Gamma(u, w)', 1.7, 2.12, { size: 12.5, baseline: 'bottom' });
          const pred = add(mv(Mx, vw ? w : u), o), err = len(subv(pred, g));
          Q.tex(`\\text{matrix}\\cdot ${vw ? 'w' : 'u'} = ${vtex(pred, 2)}`, 1.7, -1.45, { size: 12.5, color: 'muted' });
          Q.tex(`\\Gamma(u, w) = ${vtex(g, 2)}`, 1.7, -1.95, { size: 12.5, color: err < 1e-9 && len(o) < 1e-9 ? 'green' : 'red' });
          // ---- linearity defects in each slot
          const d1 = Math.max(len(subv(Gm(add(u, ta), w), add(Gm(u, w), Gm(ta, w)))), len(subv(Gm(scl(u, 2), w), scl(Gm(u, w), 2))));
          const d2 = Math.max(len(subv(Gm(u, add(w, tb)), add(Gm(u, w), Gm(u, tb)))), len(subv(Gm(u, scl(w, 2)), scl(Gm(u, w), 2))));
          st = { g, d1, d2, k: Gsel.value };
        });
        v.legend([['accent', '$u$'], ['orange', '$w$'], ['green', 'image grid and $\\Gamma(u, w)$']]);
        v.readout(() => {
          if (!st) return '';
          const { g, d1, d2, k } = st, ok1 = d1 < 1e-9, ok2 = d2 < 1e-9;
          const verdict = ok1 && ok2 ? '**bilinear** ✓' : ok1 ? 'linear in slot 1 only — not bilinear' : ok2 ? 'linear in slot 2 only — not bilinear' : 'linear in neither slot';
          return `$\\Gamma(u, w) = ${vtex(g, 3)}$. Linearity defects: slot 1 $= ${tn(d1, 3)}$ ${mark(ok1)}, slot 2 $= ${tn(d2, 3)}$ ${mark(ok2)} — ${verdict}${k === 'cross' ? '; freezing $u$ gives the skew-symmetric matrix shown.' : '.'}`;
        });
      },
    },
  ],
};
