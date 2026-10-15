// Linear Algebra Done Right (Axler, 4th ed.) — Chapter 9: Multilinear Algebra and Determinants
// Part 3 (9.27–9.36): alternating multilinear forms — they vanish on dependent lists, there are none for m > dim V,
// swapping two inputs flips the sign; the sign of a permutation and its behaviour under a swap; permuting the
// inputs of an alternating form; the formula for alternating (dim V)-linear forms.
// Parts 1–2 (9.1–9.25) are ch09.js and ch09-b.js; part 4 (9.37–9.49) is ch09-d.js.

// =====================================================================================================
// Shared helpers
// =====================================================================================================
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const sb = (k) => String(k).split('').map((d) => SUBS[+d]).join('');
/** A number for TeX: at most d decimals, trailing zeros dropped, never "-0". */
function tn(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  let s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
}
/** The same for canvas text (real minus sign). */
const pn = (x, d = 2) => tn(x, d).replace('-', '−');
/** TeX for a number that may be a rounding residue: tiny values in scientific notation. */
const small = (v, x, d = 3) => (Math.abs(x) >= 1e-9 ? tn(x, d) : x === 0 ? '0' : v.sci(x, 1));
/** Rounding residues below 1e-12 shown as 0, negative numbers in parentheses (for products in TeX). */
const zt = (x, d = 3) => (Math.abs(x) < 1e-12 ? '0' : x < 0 ? `(${tn(x, d)})` : tn(x, d));
const vtex = (a, d = 2) => `(${a.map((x) => tn(x, d)).join(', ')})`;
/** A signed coefficient in a sum: "+ 2u" / "- 0.5u". */
const term = (c, s, first = false) => (first ? `${tn(c)}${s}` : c < 0 ? ` - ${tn(-c)}${s}` : ` + ${tn(c)}${s}`);
/** A "nice" bound ≥ x from a list. */
const nice = (x, list = [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 40, 60, 100]) => list.find((t) => t >= x) ?? list[list.length - 1];

// ---------- vectors ----------
const ZERO = [0, 0, 0];
const add = (a, b) => a.map((x, i) => x + b[i]);
const sub = (a, b) => a.map((x, i) => x - b[i]);
const scl = (a, k) => a.map((x) => x * k);
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const len = (a) => Math.hypot(...a);
const unit = (a) => { const l = len(a); return l > 1e-12 ? scl(a, 1 / l) : a.map(() => 0); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const det2 = (a, b) => a[0] * b[1] - a[1] * b[0];
const det3 = (a, b, c) => dot(a, cross(b, c));
const mv = (A, x) => A.map((r) => dot(r, x));
const fromCols = (cs) => cs[0].map((_, i) => cs.map((c) => c[i]));

// ---------- permutations ----------
/** All permutations of (1, …, n), in lexicographic order. */
function perms(n) {
  const out = [];
  const rec = (pre, rest) => {
    if (!rest.length) { out.push(pre); return; }
    rest.forEach((x, i) => rec([...pre, x], [...rest.slice(0, i), ...rest.slice(i + 1)]));
  };
  rec([], Array.from({ length: n }, (_, i) => i + 1));
  return out;
}
/** Inverted position pairs of a list: p < q with a[p] > a[q]. */
function invPos(a) {
  const r = [];
  for (let p = 0; p < a.length; p++) for (let q = p + 1; q < a.length; q++) if (a[p] > a[q]) r.push([p, q]);
  return r;
}
const sign = (a) => (invPos(a).length % 2 ? -1 : 1);
const ptex = (p) => `(${p.join(', ')})`;
/** Number of cycles of a permutation of (1, …, m). */
function cycles(a) {
  const seen = new Array(a.length).fill(false); let c = 0;
  for (let i = 0; i < a.length; i++) if (!seen[i]) { c++; let j = i; while (!seen[j]) { seen[j] = true; j = a[j] - 1; } }
  return c;
}
/** The fixed "shuffled" starting list for each m. */
const START = { 2: [2, 1], 3: [3, 1, 2], 4: [3, 1, 4, 2], 5: [3, 1, 5, 4, 2], 6: [4, 1, 6, 3, 5, 2], 7: [4, 7, 1, 5, 3, 6, 2] };

// ---------- trilinear forms on R³ ----------
const FORMS = {
  vol: { f: (a, b, c) => det3(a, b, c), label: '$u\\cdot(v\\times w)$', tex: 'u\\cdot(v\\times w)', alt: true },
  mono: { f: (a, b, c) => a[0] * b[1] * c[2], label: '$u_1v_2w_3$', tex: 'u_1v_2w_3', alt: false },
  dotz: { f: (a, b, c) => dot(a, b) * c[2], label: '$\\langle u, v\\rangle\\, w_3$', tex: '\\langle u, v\\rangle\\, w_3', alt: false },
};
const formSelect = (v, def = 'vol') => v.select('$\\alpha(u, v, w) =$', Object.entries(FORMS).map(([value, F]) => ({ value, label: F.label })), def);
/** Largest |F| over 600 random lists in R³ with a repeated vector (cached per form). */
const REPEAT = {};
function repeatMax(v, key) {
  if (REPEAT[key] != null) return REPEAT[key];
  const r = v.rng(17), F = FORMS[key].f, rv = () => [r.uniform(-1, 1), r.uniform(-1, 1), r.uniform(-1, 1)];
  let best = 0;
  for (let i = 0; i < 600; i++) { const a = rv(), b = rv(), k = i % 3; best = Math.max(best, Math.abs(k === 0 ? F(a, a, b) : k === 1 ? F(a, b, a) : F(b, a, a))); }
  return (REPEAT[key] = best);
}

// ---------- multilinear forms given by their values on basis lists ----------
/** Random integer values in [lo, hi] for every index tuple in {0, …, n−1}^m (keys like '012'). */
function randTensor(r, n, m, lo = -3, hi = 3) {
  const T = {};
  const rec = (pre) => { if (pre.length === m) { T[pre] = r.int(lo, hi); return; } for (let a = 0; a < n; a++) rec(pre + a); };
  rec('');
  return T;
}
/** Σ T[i₁…i_m] · x₁[i₁] ⋯ x_m[i_m]: the multilinear form with values T on lists of standard basis vectors. */
function multi(T, n, xs) {
  let s = 0;
  const rec = (k, pre, prod) => {
    if (k === xs.length) { s += (T[pre] || 0) * prod; return; }
    for (let a = 0; a < n; a++) { const x = xs[k][a]; if (x !== 0) rec(k + 1, pre + a, prod * x); }
  };
  rec(0, '', 1);
  return s;
}

// ---------- drawing ----------
const CC = ['orange', 'purple', 'teal'];
/** Colour of an oriented volume: blue if positive, red if negative, green when (numerically) zero. */
const oriCol = (x, eps = 1e-4) => (Math.abs(x) < eps ? 'green' : x > 0 ? 'blue' : 'red');
/** Faces of the parallelepiped o + P(a, b, c) in a v.scene3. */
function pped(sc, a, b, c, st, o = ZERO) {
  const ab = add(a, b), ac = add(a, c), bc = add(b, c), abc = add(ab, c);
  for (const f of [[ZERO, a, ab, b], [c, ac, abc, bc], [ZERO, a, ac, c], [b, ab, abc, bc], [ZERO, b, bc, c], [a, ab, abc, ac]]) sc.poly(f.map((p) => add(o, p)), st);
}
/** The twelve edges of o + P(a, b, c). */
function ppedEdges(sc, a, b, c, st, o = ZERO) {
  const V = [ZERO, a, b, c, add(a, b), add(a, c), add(b, c), add(add(a, b), c)].map((p) => add(o, p));
  for (const [i, j] of [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [2, 4], [2, 6], [3, 5], [3, 6], [4, 7], [5, 7], [6, 7]]) sc.line(V[i], V[j], st, 1);
}
/** A labelled value with a bar under it, on a stage with data window [0, 1]²: "label = x", bar from 0.5 (half-width 0.44 ↔ scale). */
function vrow(R, y, label, x, scale, color, labelColor) {
  R.tex(`${label} = ${tn(x, 3)}`, 0.05, y + 0.042, { align: 'left', size: 14.5, color: labelColor || color });
  const L = Math.max(-1, Math.min(1, x / scale)) * 0.44;
  R.line(0.06, y - 0.03, 0.94, y - 0.03, { color: 'grid', width: 6 });
  if (Math.abs(L) > 2e-3) R.line(0.5, y - 0.03, 0.5 + L, y - 0.03, { color, width: 10, cap: 'butt', alpha: 0.85 });
  R.line(0.5, y - 0.07, 0.5, y + 0.01, { color: 'muted', width: 1.4 });
}
/** A numbered badge (a slot number) at the 3D point p of the scene sc drawn on stage S; call after sc.flush(). */
function badge(S, sc, p, k, color) {
  const P = sc.P(p);
  S.dot(P[0], P[1], { r: 9.5, color });
  S.text(String(k), P[0], P[1], { align: 'center', color: 'panel', size: 11.5, weight: 700, halo: false });
}
/** Two segments p1p2 and q1q2 (2D): their intersection point, or null. */
function segX(p1, p2, q1, q2) {
  const r = sub(p2, p1), s = sub(q2, q1), d = det2(r, s);
  if (Math.abs(d) < 1e-12) return null;
  const qp = sub(q1, p1), t = det2(qp, s) / d, u = det2(qp, r) / d;
  return t > 1e-9 && t < 1 - 1e-9 && u > 1e-9 && u < 1 - 1e-9 ? add(p1, scl(r, t)) : null;
}
/**
 * Strand diagram of a list of numbers on a [0, 1]² stage: the list on the top row, its stably sorted
 * rearrangement on the bottom row, and a strand from each entry to its place. Two strands cross exactly when
 * the pair is inverted. o: {top, bot, x0, x1, tokenX (override top x per position), fill(p) / strand(p) colours,
 * r (token radius px)}. Returns the list of crossings [{p, q, pt}].
 */
function strands(S, a, o = {}) {
  const m = a.length, top = o.top ?? 0.78, bot = o.bot ?? 0.2, x0 = o.x0 ?? 0.08, x1 = o.x1 ?? 0.92, r = o.r ?? 13;
  const X = (k) => (m === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * k) / (m - 1));
  const order = a.map((x, p) => [x, p]).sort((u, w) => u[0] - w[0] || u[1] - w[1]);
  const place = new Array(m); order.forEach(([, p], q) => { place[p] = q; });
  const tx = (p) => (o.tokenX ? o.tokenX(p, X(p)) : X(p));
  const dy = (top - bot) * 0.08;
  const seg = (p) => [[tx(p), top - dy], [X(place[p]), bot + dy]];
  const cr = [];
  for (let p = 0; p < m; p++) for (let q = p + 1; q < m; q++) { const [a1, a2] = seg(p), [b1, b2] = seg(q), pt = segX(a1, a2, b1, b2); if (pt) cr.push({ p, q, pt }); }
  for (let p = 0; p < m; p++) {
    const [s1, s2] = seg(p), col = o.strand ? o.strand(p) : 'accent';
    S.line(s1[0], s1[1], s2[0], s2[1], { color: col, width: o.width ? o.width(p) : 3, alpha: 0.85 });
  }
  if (o.marks !== false) for (const c of cr) S.dot(c.pt[0], c.pt[1], { r: 4.5, color: o.markColor || 'red' });
  for (let p = 0; p < m; p++) {
    const col = o.fill ? o.fill(p) : 'accent';
    S.dot(tx(p), top, { r, color: col });
    S.text(String(a[p]), tx(p), top, { align: 'center', color: 'panel', weight: 700, size: 13, halo: false });
    const q = place[p];
    S.dot(X(q), bot, { r: r - 2, hollow: true, color: o.botColor ? o.botColor(p) : col, width: 2 });
    S.text(String(order[q][0]), X(q), bot, { align: 'center', color: 'ink', weight: 600, size: 12, halo: false });
  }
  return { cr, X, place };
}

export default {
  collection: 'ladr',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.27
    {
      num: '9.27',
      kind: 'Definition',
      name: 'Alternating multilinear form',
      statement: String.raw`Suppose $m$ is a positive integer. An $m$-linear form $\alpha$ on $V$ is **alternating** if
$$\alpha(v_1, \dots, v_m) = 0$$
whenever $v_1, \dots, v_m$ is a list of vectors in $V$ in which one vector occupies two different slots, that is, $v_j = v_k$ for some $j \ne k$. The alternating $m$-linear forms on $V$ make up a subspace of $V^{(m)}$, denoted by
$$V^{(m)}_{\mathrm{alt}} = \{\alpha \in V^{(m)} : \alpha \text{ is alternating}\}.$$`,
      idea: String.raw`The condition only mentions lists with a repeated vector, but linearity in each slot spreads it much further: an alternating form also kills every linearly dependent list (9.28) and changes sign when two inputs trade places (9.30). Sums and scalar multiples of alternating forms are again alternating, so $V^{(m)}_{\mathrm{alt}}$ is a subspace; for $m = 2$ its members are the alternating bilinear forms of 9.14. The model on $\mathbf R^3$ is the signed volume $\alpha(u, v, w) = u \cdot (v \times w)$ of the parallelepiped on $u, v, w$: a box with two equal edges is flat. By contrast, $u_1v_2w_3$ is trilinear but not alternating — it equals $1$ on the list $e_1 + e_2,\ e_1 + e_2,\ e_3$.`,
      caption: String.raw`Drag the tips of $v_1, v_2, v_3$ (drag the background to rotate); a tip snaps onto another vector when it comes close, and the box — the parallelepiped on $v_1, v_2, v_3$ — goes flat. Right: the chosen trilinear form on the list, and on three lists made by copying one vector into a second slot. For the signed volume these are always $0$. Switch to $u_1v_2w_3$ or $\langle u, v\rangle w_3$: both are linear in each slot, but repeated inputs no longer give $0$, so they are not alternating.`,
      deps: ['ladr-9.25'],
      see: ['ladr-9.14'],
      tags: ['multilinear'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Alternating_multilinear_map' },
      viz(v) {
        const S = v.stage({ x: [-1.45, 2.15], y: [-1.4, 2.1], equal: true, axes: false, height: 390, weight: 1.3, minWidth: 310 });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 390, minWidth: 270, title: 'the form on the list, and with a vector repeated' });
        const sc = v.scene3(S, { yaw: -0.62, pitch: 0.3, axis: 1.5, lim: 1.5 });
        const fs = formSelect(v);
        const V0 = [[1.05, 0.1, 0.05], [-0.1, 1.0, 0.4], [0.15, 0.3, 0.95]];
        const H = [];
        const snap = (k) => (p) => { for (let j = 0; j < 3; j++) if (j !== k && H[j] && len(sub(p, H[j].p)) < 0.13) return H[j].p.slice(); return p; };
        V0.forEach((p, k) => H.push(sc.handle(p, { color: CC[k], label: `v${sb(k + 1)}`, snap: snap(k) })));
        v.button('put $v_1$ into slot 2', () => H[1].set(H[0].p));
        v.button('reset', () => V0.forEach((p, k) => H[k].set(p)));
        let st = null;
        v.render(() => {
          const key = fs.value, F = FORMS[key].f, [a, b, c] = H.map((h) => h.p);
          const vol = det3(a, b, c), val = F(a, b, c);
          const tests = [['\\alpha(v_1, v_1, v_3)', F(a, a, c)], ['\\alpha(v_3, v_2, v_3)', F(c, b, c)], ['\\alpha(v_1, v_2, v_2)', F(a, b, b)]];
          sc.begin();
          pped(sc, a, b, c, { fill: oriCol(vol), color: oriCol(vol), fillAlpha: 0.1, alpha: 0.55 });
          H.forEach((h, k) => sc.arrow(ZERO, h.p, { color: CC[k], width: 3.2 }));
          sc.flush();
          const eq = [];
          for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (len(sub(H[i].p, H[j].p)) < 1e-9) eq.push(`v${sb(i + 1)} = v${sb(j + 1)}`);
          S.corner(eq.length ? `${eq.join(', ')}: a repeated vector` : 'three different vectors', 'tl', { color: eq.length ? 'gold' : 'muted', weight: 700 });
          S.corner(Math.abs(vol) < 1e-4 ? 'flat box: volume 0' : `box volume ${pn(vol, 3)}`, 'bl', { color: oriCol(vol), weight: 600 });
          const scale = nice(1.1 * Math.max(0.5, Math.abs(val), ...tests.map((t) => Math.abs(t[1]))));
          vrow(R, 0.84, '\\alpha(v_1, v_2, v_3)', val, scale, 'accent', 'ink');
          R.line(0.04, 0.71, 0.96, 0.71, { color: 'faint', width: 1 });
          R.text('the same vector in two slots:', 0.05, 0.66, { size: 12, color: 'muted' });
          tests.forEach(([l, x], k) => vrow(R, 0.54 - 0.15 * k, l, x, scale, Math.abs(x) < 1e-9 ? 'green' : 'red'));
          const bad = tests.some((t) => Math.abs(t[1]) > 1e-9);
          R.text(bad ? 'a repeated input gives a nonzero value' : 'repeated inputs give 0', 0.5, 0.07, { align: 'center', size: 13, weight: 700, color: bad ? 'red' : 'green' });
          st = { key, val, tests, w: repeatMax(v, key) };
        });
        v.legend([['orange', '$v_1$'], ['purple', '$v_2$'], ['teal', '$v_3$'], ['blue', 'box, positively oriented', { area: true }], ['red', 'negatively oriented', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { key, val, tests, w } = st, F = FORMS[key];
          const head = `$\\alpha(v_1, v_2, v_3) = ${tn(val, 3)}$ for $\\alpha(u, v, w) = ${F.tex}$.`;
          if (F.alt) return `${head} On 600 random lists with a repeated vector the largest $|\\alpha|$ is $${small(v, w)}$ (rounding): **alternating**.`;
          const t = tests.find((x) => Math.abs(x[1]) > 1e-9) || tests[0];
          return `${head} Here $${t[0]} = ${tn(t[1], 3)}$, and on 600 random lists with a repeated vector $|\\alpha|$ reaches $${tn(w, 2)}$: trilinear, but **not alternating**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.28
    {
      num: '9.28',
      kind: 'Theorem',
      name: 'Alternating forms vanish on dependent lists',
      statement: String.raw`Suppose $m$ is a positive integer and $\alpha$ is an alternating $m$-linear form on $V$. If $v_1, \dots, v_m$ is a linearly dependent list in $V$, then
$$\alpha(v_1, \dots, v_m) = 0.$$`,
      idea: String.raw`By the linear dependence lemma (2.19), some $v_k$ is a linear combination $b_1v_1 + \cdots + b_{k-1}v_{k-1}$ of the vectors before it. Substitute this into slot $k$ and expand by linearity in that slot: $\alpha(v_1, \dots, v_m) = \sum_{j<k} b_j\,\alpha(v_1, \dots, v_{k-1}, v_j, v_{k+1}, \dots, v_m)$. In the $j$th term the vector $v_j$ sits in slot $j$ and again in slot $k$, so the term is $0$ because $\alpha$ is alternating (9.27).`,
      caption: String.raw`Drag $v_1$, $v_2$ and $v_3$ (drag the background to rotate). The disc is the plane spanned by $v_1, v_2$, and the dashed path writes $v_3 = b_1v_1 + b_2v_2 + t\,n$ with $n$ a unit normal; $v_3$ snaps into the plane when it comes close. The graph shows $t \mapsto \alpha(v_1, v_2, b_1v_1 + b_2v_2 + t\,n)$ — a straight line, by linearity in slot 3 — with the gold dot at the current $v_3$. The dependent lists are $t = 0$, and for the signed volume the line passes through $0$ there. Pick a non-alternating form: the line misses $0$, so a dependent list gets a nonzero value.`,
      deps: ['ladr-2.19', 'ladr-9.27'],
      tags: ['multilinear', 'independence'],
      viz(v) {
        const S = v.stage({ x: [-1.45, 2.15], y: [-1.4, 2.1], equal: true, axes: false, height: 390, weight: 1.3, minWidth: 310 });
        const P = v.stage({ x: [-1.5, 1.5], y: [-2, 2], height: 390, minWidth: 270, xlabel: 't', title: '$t \\mapsto \\alpha(v_1, v_2,\\ b_1v_1 + b_2v_2 + t\\,n)$' });
        const sc = v.scene3(S, { yaw: -0.5, pitch: 0.36, axis: 1.75, lim: 1.6 });
        const fs = formSelect(v);
        const H = [];
        const proj = (p) => { const n = cross(H[0].p, H[1].p), nn = len(n); if (nn < 1e-9) return p; return sub(p, scl(n, dot(p, n) / (nn * nn))); };
        const snapPlane = (p) => { const n = cross(H[0].p, H[1].p), nn = len(n); if (nn < 1e-9) return p; return Math.abs(dot(p, n) / nn) < 0.08 ? proj(p) : p; };
        H.push(sc.handle([0.95, 0.1, 0.25], { color: CC[0], label: 'v₁' }));
        H.push(sc.handle([0.2, 0.85, 0.55], { color: CC[1], label: 'v₂' }));
        H.push(sc.handle([0.64, 0.36, 0.34], { color: CC[2], label: 'v₃', snap: snapPlane }));
        H[2].set(proj(H[2].p));
        v.button('drop $v_3$ into the plane', () => H[2].set(proj(H[2].p)));
        v.button('lift $v_3$ out', () => { const n = unit(cross(H[0].p, H[1].p)); H[2].set(add(proj(H[2].p), scl(n, 0.7))); });
        let st = null, view = 0;
        v.render(() => {
          const F = FORMS[fs.value].f, [a, b, c] = H.map((h) => h.p), nr = cross(a, b), nn = len(nr);
          let dec = null;
          sc.begin();
          if (nn > 1e-6) {
            const n = scl(nr, 1 / nn), t = dot(c, n), w = sub(c, scl(n, t));
            const g11 = dot(a, a), g12 = dot(a, b), g22 = dot(b, b), r1 = dot(w, a), r2 = dot(w, b), D = g11 * g22 - g12 * g12;
            dec = { n, t, w, b1: (r1 * g22 - r2 * g12) / D, b2: (g11 * r2 - g12 * r1) / D };
            const e1 = unit(a), e2 = cross(n, e1);
            sc.disc(e1, e2, 1.55, { fill: 'accent', color: 'accent', fillAlpha: 0.05, alpha: 0.3, grid: true });
            const p1 = scl(a, dec.b1), p2 = add(p1, scl(b, dec.b2));
            sc.line(ZERO, p1, { color: CC[0], width: 2.2, dash: [4, 3] });
            sc.line(p1, p2, { color: CC[1], width: 2.2, dash: [4, 3] });
            if (Math.abs(t) > 1e-6) sc.line(p2, c, { color: 'gold', width: 2.2, dash: [4, 3] });
          }
          const vol = det3(a, b, c);
          pped(sc, a, b, c, { fill: oriCol(vol), color: oriCol(vol), fillAlpha: 0.1, alpha: 0.5 });
          H.forEach((h, k) => sc.arrow(ZERO, h.p, { color: CC[k], width: 3.2 }));
          sc.flush();
          const dependent = !dec || Math.abs(dec.t) < 1e-6;
          S.corner(!dec ? 'v₁, v₂ parallel: dependent' : dependent ? 'v₃ in span(v₁, v₂): dependent' : 'v₁, v₂, v₃ independent', 'tl', { color: dependent ? 'green' : 'muted', weight: 700 });
          if (dec) {
            const f0 = F(a, b, dec.w), f1 = F(a, b, dec.n), f = (t) => f0 + t * f1;
            const Y = nice(1.12 * Math.max(0.6, Math.abs(f(-1.5)), Math.abs(f(1.5))), [0.75, 1, 1.5, 2, 3, 4, 6, 8, 12]);
            if (Y !== view) { view = Y; P.setView([-1.5, 1.5], [-Y, Y]); }
            P.vband(-0.02, 0.02, { color: 'green', alpha: 0.18 });
            P.text('t = 0: dependent lists', 0.06, -0.9 * Y, { size: 12, color: 'green', weight: 600 });
            P.fn(f, { color: 'accent', width: 2.6 });
            const ok = Math.abs(f0) < 1e-9;
            P.dot(0, f0, { r: 7, color: ok ? 'green' : 'red' });
            P.corner(`at $t = 0$: $\\alpha = ${tn(f0, 3)}$`, 'tl', { color: ok ? 'green' : 'red', weight: 700, size: 13 });
            P.dot(dec.t, f(dec.t), { r: 5.5, color: 'gold' });
          }
          st = { dec, val: F(a, b, c), F, a, b };
        });
        v.legend([['orange', '$v_1$'], ['purple', '$v_2$'], ['teal', '$v_3$'], ['accent', 'plane spanned by $v_1, v_2$', { area: true }], ['gold', 'current $v_3$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { dec, val, F, a, b } = st;
          if (!dec) return `$v_1$ and $v_2$ are parallel, so the list is dependent: $\\alpha(v_1, v_2, v_3) = ${small(v, val)}$.`;
          const x1 = F(a, b, a), x2 = F(a, b, b), x3 = F(a, b, dec.n);
          const t = Math.abs(dec.t) < 5e-4 ? 0 : dec.t;
          return `$v_3 = ${term(dec.b1, '\\,v_1', true)}${term(dec.b2, '\\,v_2')}${term(t, '\\,n')}$, so by linearity in slot 3: $\\alpha(v_1, v_2, v_3) = ${zt(dec.b1, 2)}\\,\\alpha(v_1, v_2, v_1) + ${zt(dec.b2, 2)}\\,\\alpha(v_1, v_2, v_2) + ${zt(t, 2)}\\,\\alpha(v_1, v_2, n) = ${zt(dec.b1, 2)}\\cdot ${zt(x1)} + ${zt(dec.b2, 2)}\\cdot ${zt(x2)} + ${zt(t, 2)}\\cdot ${zt(x3)} = ${tn(Math.abs(val) < 1e-12 ? 0 : val, 3)}$.` +
            (Math.abs(x1) < 1e-9 && Math.abs(x2) < 1e-9 ? ' The first two terms vanish because $\\alpha$ is alternating; only the part of $v_3$ off the plane counts.' : ' The first two terms are **not** $0$: this form is not alternating, and dependent lists ($t = 0$) need not give $0$.');
        });
      },
    },
    // ------------------------------------------------------------------ 9.29
    {
      num: '9.29',
      kind: 'Theorem',
      name: 'No nonzero alternating m-forms when m > dim V',
      statement: String.raw`Suppose $m > \dim V$. Then $0$ is the only alternating $m$-linear form on $V$; that is, $V^{(m)}_{\mathrm{alt}} = \{0\}$.`,
      idea: String.raw`A list of $m$ vectors in $V$ with $m > \dim V$ is longer than a spanning list of $V$, so it is linearly dependent (2.22). An alternating form vanishes on every dependent list (9.28). Hence every alternating $m$-linear form on $V$ takes the value $0$ on every input. A handy way to manufacture alternating forms is to antisymmetrize any $m$-linear form $\beta$: $\alpha(v_1, \dots, v_m) = \sum_{(j_1, \dots, j_m)} \operatorname{sign}(j_1, \dots, j_m)\, \beta(v_{j_1}, \dots, v_{j_m})$ is always alternating (Exercise 9B.5) — so when $m > \dim V$ its terms must cancel.`,
      caption: String.raw`Drag $u, v, w$ in $\mathbf R^2$. Three vectors in a plane are always dependent: the gold dashed triangle is a relation $c_1u + c_2v + c_3w = 0$, closing up at the origin. Right: $\beta$ is a random trilinear form on $\mathbf R^2$ (press *new* $\beta$), and the bars are the six signed terms of its antisymmetrization $\alpha$; whatever you do, they add up to $0$. Choose $m = 2$, so that $m = \dim V$ and the hypothesis fails: the antisymmetrization $\beta(u, v) - \beta(v, u)$ of a bilinear form is usually not $0$.`,
      deps: ['ladr-2.22', 'ladr-9.28'],
      tags: ['multilinear'],
      viz(v) {
        const S = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 370, minWidth: 270, ticks: false, title: 'vectors in $V = \\mathbf R^2$' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 370, minWidth: 310, weight: 1.15, title: 'terms of $\\alpha$, the antisymmetrization of $\\beta$' });
        const mode = v.select('', [{ value: '3', label: '$m = 3 > \\dim \\mathbf R^2$' }, { value: '2', label: '$m = 2 = \\dim \\mathbf R^2$' }], '3');
        let seed = 3, T3 = null, T2 = null;
        const reseed = () => { const r = v.rng(seed); T3 = randTensor(r, 2, 3); T2 = randTensor(r, 2, 2); };
        reseed();
        v.button('new $\\beta$', () => { seed++; reseed(); });
        const snap = (x, y) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
        const hs = [S.handle(1.5, 0.3, { color: CC[0], label: 'u', constrain: snap }), S.handle(0.4, 1.3, { color: CC[1], label: 'v', constrain: snap }), S.handle(-1.1, 0.6, { color: CC[2], label: 'w', constrain: snap })];
        const NM = ['u', 'v', 'w'];
        const maxCache = {};
        const alt = (T, m, L) => perms(m).reduce((s, p) => s + sign(p) * multi(T, 2, p.map((j) => L[j - 1])), 0);
        const sampleMax = (m) => {
          const k = `${seed}-${m}`; if (maxCache[k] != null) return maxCache[k];
          const r = v.rng(99), T = m === 3 ? T3 : T2; let best = 0;
          for (let i = 0; i < 1000; i++) best = Math.max(best, Math.abs(alt(T, m, Array.from({ length: m }, () => [r.uniform(-2, 2), r.uniform(-2, 2)]))));
          return (maxCache[k] = best);
        };
        let st = null;
        v.render(() => {
          const m = +mode.value, L = hs.slice(0, m).map((h) => [h.x, h.y]), T = m === 3 ? T3 : T2;
          hs[2].visible = m === 3;
          const terms = perms(m).map((p) => ({ p, s: sign(p), val: sign(p) * multi(T, 2, p.map((j) => L[j - 1])) }));
          const total = terms.reduce((s, t) => s + t.val, 0);
          let rel = null;
          if (m === 3) {
            let c = cross([L[0][0], L[1][0], L[2][0]], [L[0][1], L[1][1], L[2][1]]);
            const sz = Math.max(...c.map((ck, k) => Math.abs(ck) * len(L[k])));
            if (sz > 1e-9) {
              c = scl(c, 1.5 / sz); const mx = c.reduce((q, x) => (Math.abs(x) > Math.abs(q) ? x : q), 0); if (mx < 0) c = scl(c, -1);
              rel = c;
              let p = [0, 0];
              c.forEach((ck, k) => { const q = add(p, scl(L[k], ck)); S.arrow(p[0], p[1], q[0], q[1], { color: 'gold', width: 2.2, dash: [5, 4], head: 9 }); p = q; });
            }
            S.corner(rel ? `$${term(rel[0], 'u', true)}${term(rel[1], 'v')}${term(rel[2], 'w')} = 0$` : 'all three vectors parallel', 'tl', { color: 'gold', weight: 700 });
          } else {
            const d = det2(L[0], L[1]);
            S.poly([[0, 0], L[0], add(L[0], L[1]), L[1]], { fill: oriCol(d, 1e-9), color: oriCol(d, 1e-9), width: 1.4, fillAlpha: 0.14 });
            S.corner(Math.abs(d) < 1e-9 ? 'u, v dependent' : 'u, v independent: a basis of R²', 'tl', { color: 'muted', weight: 700 });
          }
          L.forEach((x, k) => S.arrow(0, 0, x[0], x[1], { color: CC[k], width: 3 }));
          // the bars
          const scale = nice(1.1 * Math.max(1, ...terms.map((t) => Math.abs(t.val)), Math.abs(total)), [2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 40, 60, 80, 100, 150, 200]);
          const rows = [...terms.map((t) => ({ lab: `${t.s > 0 ? '+' : '-'}\\beta(${t.p.map((j) => NM[j - 1]).join(', ')})`, val: t.val, col: t.s > 0 ? 'blue' : 'red' })), null,
            { lab: `\\alpha(${NM.slice(0, m).join(', ')})`, val: total, col: Math.abs(total) < 1e-9 ? 'green' : 'gold', bold: true }];
          const dy = m === 3 ? 0.105 : 0.17, x0 = 0.735, W = 0.235;
          let y = m === 3 ? 0.9 : 0.78;
          for (const r of rows) {
            if (!r) { B.line(0.03, y + dy * 0.45, 0.97, y + dy * 0.45, { color: 'muted', width: 1 }); y -= dy * 0.35; continue; }
            B.tex(r.lab, 0.03, y, { align: 'left', size: 14, color: r.bold ? r.col : 'ink' });
            B.text(pn(r.val, Math.abs(r.val) < 1e-9 ? 0 : 2), 0.47, y, { align: 'right', size: 12.5, color: r.col, weight: r.bold ? 700 : 500 });
            B.line(x0 - W, y, x0 + W, y, { color: 'grid', width: 5 });
            const Lb = Math.max(-1, Math.min(1, r.val / scale)) * W;
            if (Math.abs(Lb) > 1e-3) B.line(x0, y, x0 + Lb, y, { color: r.col, width: 11, cap: 'butt', alpha: 0.85 });
            B.line(x0, y - 0.03, x0, y + 0.03, { color: 'muted', width: 1.2 });
            y -= dy;
          }
          B.text(m === 3 ? 'the six terms always cancel' : 'the two terms need not cancel', 0.5, 0.05, { align: 'center', size: 12.5, weight: 700, color: m === 3 ? 'green' : 'gold' });
          st = { m, total, rel, mx: sampleMax(m) };
        });
        v.legend([['blue', 'term with sign $+1$'], ['red', 'term with sign $-1$'], ['gold', 'a dependence relation', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { m, total, rel, mx } = st;
          if (m === 3) return `${rel ? `$u, v, w$ are dependent: $${term(rel[0], 'u', true)}${term(rel[1], 'v')}${term(rel[2], 'w')} = 0$. ` : ''}The six signed terms add up to $\\alpha(u, v, w) = ${small(v, total)}$, and over $1000$ random triples in $\\mathbf R^2$ the largest $|\\alpha|$ is $${small(v, mx)}$: this alternating $3$-linear form is the zero form.`;
          return `With $m = 2 = \\dim V$: $\\alpha(u, v) = \\beta(u, v) - \\beta(v, u) = ${tn(total, 3)}$, and over $1000$ random pairs $|\\alpha|$ reaches $${tn(mx, 2)}$ — an alternating form that is not $0$, so the hypothesis $m > \\dim V$ cannot be dropped.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.30
    {
      num: '9.30',
      kind: 'Theorem',
      name: 'Swapping inputs of an alternating form',
      statement: String.raw`Suppose $m$ is a positive integer, $\alpha$ is an alternating $m$-linear form on $V$, and $v_1, \dots, v_m$ is a list of vectors in $V$. Then interchanging the vectors in any two slots of $\alpha(v_1, \dots, v_m)$ multiplies its value by $-1$; for example,
$$\alpha(v_2, v_1, v_3, \dots, v_m) = -\alpha(v_1, v_2, v_3, \dots, v_m).$$`,
      idea: String.raw`Put $v_1 + v_2$ into both of the first two slots: the result is $0$ because $\alpha$ is alternating. Expanding by linearity in each slot gives four terms, $\alpha(v_1, v_1, \dots) + \alpha(v_1, v_2, \dots) + \alpha(v_2, v_1, \dots) + \alpha(v_2, v_2, \dots)$, and the first and last vanish, leaving $\alpha(v_2, v_1, \dots) = -\alpha(v_1, v_2, \dots)$ — the same computation as for bilinear forms (9.16). Any other pair of slots is handled identically. Repeating, an odd number of swaps multiplies the value by $-1$ and an even number leaves it alone.`,
      caption: String.raw`Drag $v_1, v_2, v_3$ (handles; drag the background to rotate) and choose two slots. The slider swaps them continuously: the arrows show what is in slots $1, 2, 3$ at time $t$, with the moving inputs sliding along the gold segment, and the box is the parallelepiped they span (blue or red by orientation; the dashed box is the original). The graph is the value of the form along the way. For the signed volume it is the straight line $(1 - 2t)\,\alpha(v_1, v_2, v_3)$: it crosses $0$ at $t = \tfrac12$, where both slots hold the same vector, and ends at exactly $-\alpha(v_1, v_2, v_3)$ (green dashed line). A non-alternating form ends somewhere else.`,
      deps: ['ladr-9.16', 'ladr-9.27'],
      tags: ['multilinear'],
      viz(v) {
        const S = v.stage({ x: [-1.45, 2.15], y: [-1.4, 2.1], equal: true, axes: false, height: 390, weight: 1.3, minWidth: 310 });
        const P = v.stage({ x: [-0.16, 1.06], y: [-2, 2], height: 390, minWidth: 270, xlabel: 't', xticks: [0, 0.25, 0.75, 1], title: 'value of the form during the swap' });
        const sc = v.scene3(S, { yaw: -0.62, pitch: 0.3, axis: 1.5, lim: 1.5 });
        const fs = formSelect(v);
        const pair = v.select('swap slots', [{ value: '01', label: '$1 \\leftrightarrow 2$' }, { value: '02', label: '$1 \\leftrightarrow 3$' }, { value: '12', label: '$2 \\leftrightarrow 3$' }], '01');
        const ts = v.slider('swap progress $t$', 0, 1, 0.3, { step: 0.01 });
        const V0 = [[1.05, 0.1, 0.05], [-0.1, 1.0, 0.4], [0.15, 0.3, 0.95]];
        const H = V0.map((p, k) => sc.handle(p, { color: CC[k], label: `v${sb(k + 1)}` }));
        let st = null, view = 0;
        v.render(() => {
          const [i, j] = pair.value.split('').map(Number), V = H.map((h) => h.p), F = FORMS[fs.value].f;
          const put = (x, y) => V.map((z, k) => (k === i ? x : k === j ? y : z));
          const at = (s) => put(add(scl(V[i], 1 - s), scl(V[j], s)), add(scl(V[i], s), scl(V[j], 1 - s)));
          const f = (s) => F(...at(s)), t = ts.value, X = at(t), vol = det3(...X);
          sc.begin();
          ppedEdges(sc, V[0], V[1], V[2], { color: 'muted', width: 1, dash: [3, 4], alpha: 0.55 });
          pped(sc, X[0], X[1], X[2], { fill: oriCol(vol), color: oriCol(vol), fillAlpha: 0.12, alpha: 0.6 });
          sc.line(V[i], V[j], { color: 'gold', width: 2, dash: [2, 4] }, 1);
          X.forEach((x, k) => sc.arrow(ZERO, x, { color: k === i || k === j ? 'gold' : CC[k], width: 3.2 }));
          sc.flush();
          X.forEach((x, k) => badge(S, sc, scl(x, 0.6), k + 1, k === i || k === j ? 'gold' : CC[k]));
          S.corner(`slots ${i + 1} and ${j + 1} trading places (badges = slot numbers)`, 'tl', { color: 'gold', weight: 700 });
          // the graph
          const f0 = f(0), f1 = f(1);
          let mx = 0.5; for (let k = 0; k <= 40; k++) mx = Math.max(mx, Math.abs(f(k / 40)));
          const Y = nice(1.18 * Math.max(mx, Math.abs(f0)), [0.75, 1, 1.5, 2, 3, 4, 6, 8, 12]);
          if (Y !== view) { view = Y; P.setView([-0.16, 1.06], [-Y, Y]); }
          P.hline(-f0, { color: 'green', dash: [6, 4], width: 1.4 });
          P.vline(0.5, { color: 'muted', dash: [3, 4], width: 1 });
          P.text('equal inputs', 0.5, -0.92 * Y, { align: 'center', size: 11.5, color: 'muted' });
          P.fn(f, { domain: [0, 1], color: 'accent', width: 2.6 });
          const okEnd = Math.abs(f1 + f0) < 1e-9 * Math.max(1, Math.abs(f0));
          P.dot(0, f0, { r: 5.5, color: 'accent' });
          P.dot(1, f1, { r: 7, color: okEnd ? 'green' : 'red' });
          P.dot(t, f(t), { r: 5.5, color: 'gold' });
          P.text('before', 0, f0, { size: 12, color: 'accent', dx: 10, dy: f0 >= 0 ? -14 : 14 });
          P.text('after', 1, f1, { size: 12, color: okEnd ? 'green' : 'red', align: 'right', dx: -10, dy: f1 >= 0 ? -14 : 14 });
          st = { i, j, f0, f1, ft: f(t), t, okEnd, ii: F(...put(V[i], V[i])), jj: F(...put(V[j], V[j])), both: F(...put(add(V[i], V[j]), add(V[i], V[j]))) };
        });
        v.legend([['orange', '$v_1$'], ['purple', '$v_2$'], ['teal', '$v_3$'], ['gold', 'the two inputs being swapped'], ['green', '$-\\alpha(v_1, v_2, v_3)$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { i, j, f0, f1, okEnd, ii, jj, both } = st;
          const a = i + 1, b = j + 1;
          const ratio = Math.abs(f0) > 1e-9 ? `; the ratio is $${tn(f1 / f0, 4)}$` : '';
          const sl = (x, y) => `\\alpha(\\overset{${a}}{${x}}, \\overset{${b}}{${y}})`;
          const exp = `$${sl(`v_${a} + v_${b}`, `v_${a} + v_${b}`)} = ${sl(`v_${a}`, `v_${a}`)} + ${sl(`v_${a}`, `v_${b}`)} + ${sl(`v_${b}`, `v_${a}`)} + ${sl(`v_${b}`, `v_${b}`)}$, that is, $${zt(both)} = ${zt(ii)} + ${zt(f0)} + ${zt(f1)} + ${zt(jj)}$`;
          return `Before: $${tn(f0, 3)}$. After swapping slots ${a} and ${b}: $${tn(f1, 3)}$${ratio}. Expanding as in the proof (only slots ${a} and ${b} shown): ${exp}. ` +
            (okEnd ? 'The outer terms vanish, so the middle two are opposite.' : 'The outer terms are **not** $0$ — the form is not alternating — and the swap does not simply flip the sign.');
        });
      },
    },
    // ------------------------------------------------------------------ 9.32
    {
      num: '9.32',
      kind: 'Definition',
      name: 'Sign of a permutation',
      statement: String.raw`A **permutation** of $(1, \dots, m)$ is a list $(j_1, \dots, j_m)$ containing each of the numbers $1, \dots, m$ exactly once; the set of all of them is denoted $\operatorname{perm} m$ (9.31). The **sign** of a permutation $(j_1, \dots, j_m)$ is
$$\operatorname{sign}(j_1, \dots, j_m) = (-1)^N,$$
where $N$ is the number of pairs of integers $(k, \ell)$ with $1 \le k < \ell \le m$ such that $k$ appears after $\ell$ in the list $(j_1, \dots, j_m)$.`,
      idea: String.raw`$N$ counts the pairs whose natural order has been reversed — the *inversions*. Draw the list on one row and $1, \dots, m$ on another, joining equal numbers by straight strands: two strands cross exactly when their pair is inverted, so $N$ is the number of crossings. The point of the definition is that it is intrinsic: the number of swaps needed to sort the list depends on which swaps you use, but its parity does not (9.34), and $(-1)^N$ records that parity. For example $\operatorname{sign}(2, 1, 3, 4) = -1$, and $\operatorname{sign}(2, 3, \dots, m, 1) = (-1)^{m-1}$, since the only inverted pairs are $(1, \ell)$ for $\ell = 2, \dots, m$.`,
      caption: String.raw`Drag an entry of the top row sideways to move it to a new place in the list; the strands follow, and each crossing (red dot) is an inverted pair. Right: the triangle of all pairs $(k, \ell)$ with $k < \ell$, the inverted ones in red; $N$ counts them. Choose *only adjacent descents* to count just the neighbouring out-of-order entries (gold) instead: that number can have the wrong parity — try *reverse* with $m = 3$, where $(3, 2, 1)$ has two descents but is sorted by a single swap.`,
      deps: [],
      tags: ['permutations'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Parity_of_a_permutation' },
      viz(v) {
        const PAL = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold'];
        const mS = v.slider('$m$', 2, 7, 5, { int: true });
        const cnt = v.select('count', [{ value: 'all', label: 'every inverted pair (the definition)' }, { value: 'adj', label: 'only adjacent descents' }], 'all');
        let a = START[5].slice(), drag = null, seed = 1;
        v.button('shuffle', () => { const r = v.rng(++seed); a = r.shuffle(a.slice()); });
        v.button('reverse', () => { a = a.slice().reverse(); });
        v.button('identity', () => { a = a.slice().sort((x, y) => x - y); });
        const S = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.5, minWidth: 330, title: 'top: the list; bottom: $1, \\dots, m$' });
        const G = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 230, title: 'pairs $(k, \\ell)$ with $k < \\ell$' });
        const TG = v.table(G, { rows: 6, cols: 6, region: [0.02, 0.2, 0.98, 0.99], maxCell: 40, size: 13, rowLabels: (k) => `$${k + 1}$`, colLabels: (j) => `$${j + 2}$` });
        const TOP = 0.78, X = (k, m) => 0.08 + (0.84 * k) / (m - 1);
        const landing = (x, m) => Math.max(0, Math.min(m - 1, Math.round(((x - 0.08) / 0.84) * (m - 1))));
        const moved = (d) => { const b = a.slice(), [val] = b.splice(d.p, 1); b.splice(landing(d.x, a.length), 0, val); return b; };
        S.onDrag((x, y, ph) => {
          const m = a.length;
          if (ph === 'start') {
            let best = -1, bd = 0.06;
            for (let p = 0; p < m; p++) { const d = Math.abs(x - X(p, m)); if (d < bd && Math.abs(y - TOP) < 0.12) { bd = d; best = p; } }
            drag = best >= 0 ? { p: best, x: X(best, m) } : null; return;
          }
          if (!drag) return;
          drag.x = Math.max(0.03, Math.min(0.97, x));
          if (ph === 'end') { a = moved(drag); drag = null; }
        });
        let st = null;
        v.render(() => {
          const m = mS.value;
          if (a.length !== m) a = START[m].slice();
          // while dragging, show the list the drop would produce, with the dragged entry under the pointer
          const list = drag ? moved(drag) : a, dp = drag ? landing(drag.x, m) : -1;
          const inv = invPos(list), N = inv.length;
          const desc = []; for (let p = 0; p + 1 < m; p++) if (list[p] > list[p + 1]) desc.push(p);
          const adj = cnt.value === 'adj';
          const { cr } = strands(S, list, {
            top: TOP, bot: 0.2, tokenX: (p, x) => (p === dp ? drag.x : x),
            fill: (p) => PAL[list[p] - 1], strand: (p) => PAL[list[p] - 1], botColor: (p) => PAL[list[p] - 1],
            markColor: 'red', marks: !adj,
          });
          if (adj) for (const p of desc) { const x0 = X(p, m), x1 = X(p + 1, m); S.line(x0 + 0.02, TOP + 0.075, x1 - 0.02, TOP + 0.075, { color: 'gold', width: 3 }); S.text('>', (x0 + x1) / 2, TOP + 0.075, { align: 'center', size: 13, weight: 700, color: 'gold', dy: -10 }); }
          S.tex(ptex(list), 0.5, 0.95, { size: 15 });
          const D = desc.length, used = adj ? D : N, s = used % 2 ? -1 : 1;
          S.tex(adj ? `D = ${D}\\text{ adjacent descents, }\\ (-1)^{${D}} = ${s > 0 ? '+1' : '-1'}` : `N = ${cr.length}\\text{ crossings, }\\ \\operatorname{sign} = (-1)^{${N}} = ${s > 0 ? '+1' : '-1'}`, 0.5, 0.055, { size: 15, color: adj ? 'gold' : s > 0 ? 'blue' : 'red' });
          // the pair triangle
          const pos = []; list.forEach((x, p) => { pos[x] = p; });
          const isInv = (k, l) => pos[k] > pos[l];
          const isDesc = (k, l) => pos[k] === pos[l] + 1;
          TG.draw({
            rows: m - 1, cols: m - 1,
            value: (i, j) => (i <= j ? (isInv(i + 1, j + 2) ? '×' : '·') : null),
            fill: (i, j) => (i > j ? ['faint', 0.12] : adj ? (isDesc(i + 1, j + 2) ? ['gold', 0.45] : isInv(i + 1, j + 2) ? ['red', 0.12] : null) : isInv(i + 1, j + 2) ? ['red', 0.4] : null),
            textColor: (i, j) => (isInv(i + 1, j + 2) ? 'ink' : 'faint'),
          });
          G.tex(adj ? `D = ${D}\\ \\text{(gold)},\\quad N = ${N}` : `N = ${N}\\ \\text{inverted pairs (red)}`, 0.5, 0.09, { size: 14, color: adj ? 'gold' : 'red' });
          st = { list, N, D, adj, m, inv };
        });
        v.readout(() => {
          if (!st) return '';
          const { list, N, D, adj, m } = st, c = cycles(list), selSw = m - c;
          const pairs = []; list.forEach((x, p) => list.forEach((y, q) => { if (p < q && x > y) pairs.push(`(${y}, ${x})`); }));
          const sN = N % 2 ? '-1' : '+1';
          if (!adj) return `$\\operatorname{sign}${ptex(list)} = (-1)^{${N}} = ${sN}$; inverted pairs $(k, \\ell)$: ${pairs.length ? `$${pairs.join(',\\ ')}$` : 'none'}. Sorting by adjacent swaps (bubble sort) takes exactly $N = ${N}$ swaps; sorting by selection takes $${selSw}$ swaps ($m$ minus the number of cycles)${selSw === N ? ' — here the same number' : ' — a different number, of the same parity'}.`;
          const agree = D % 2 === N % 2;
          return `Adjacent descents: $D = ${D}$, so $(-1)^D = ${D % 2 ? '-1' : '+1'}$, while $N = ${N}$ inverted pairs give $${sN}$ and selection sort uses $${selSw}$ swaps. ${agree ? 'Here the parities happen to agree, but' : '**They disagree:**'} descents miss the inverted pairs that are not neighbours, and their count does not change parity under every swap — so only $(-1)^N$ gives a well-defined sign.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.34
    {
      num: '9.34',
      kind: 'Theorem',
      name: 'Swapping two entries of a permutation flips its sign',
      statement: String.raw`Interchanging two entries of a permutation multiplies its sign by $-1$.`,
      idea: String.raw`Compare the inverted pairs before and after interchanging two entries $x$ and $y$. The pair $\{x, y\}$ itself changes status, a change of $\pm 1$. An entry $c$ lying between the two swapped positions forms two pairs with them, $\{x, c\}$ and $\{c, y\}$: if $c$ was in natural order with respect to both, it is now with respect to neither, and vice versa (change $\pm 2$); if it was in natural order with respect to exactly one, it still is (change $0$). Pairs involving entries outside the swapped range, or not involving $x$ or $y$, are unaffected. So $N$ changes by $\pm1$ plus a sum of even numbers — an odd number — and $(-1)^N$ flips.`,
      caption: String.raw`Click two entries of the left list to choose the pair to swap (gold); the right panel shows the list after the swap. Entries strictly between the two positions are orange when their value lies between the swapped values (their two pairs flip together, change $\pm 2$) and grey otherwise (change $0$); the small numbers above them are the changes. The total change in the number of crossings is always odd. Choose *a list with a repeated entry* to drop the hypothesis that the entries are distinct: an in-between copy of a swapped value changes the count by $\pm 1$ (red), and the change can be even — try swapping the $3$ and the second $1$.`,
      deps: ['ladr-9.32'],
      tags: ['permutations'],
      viz(v) {
        const S1 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 280, title: 'before — click two entries' });
        const S2 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 280, title: 'after the swap' });
        const PRE = { perm: { a: [1, 6, 3, 2, 5, 4], sel: [1, 5] }, rep: { a: [3, 1, 4, 1, 5, 2], sel: [0, 3] } };
        let a = PRE.perm.a.slice(), sel = PRE.perm.sel.slice(), seed = 4;
        const kind = v.select('', [{ value: 'perm', label: 'a permutation' }, { value: 'rep', label: 'a list with a repeated entry' }], 'perm', { onChange: (k) => { a = PRE[k].a.slice(); sel = PRE[k].sel.slice(); } });
        v.button('shuffle', () => { const r = v.rng(++seed); a = r.shuffle(a.slice()); });
        const TOP = 0.74, X = (k) => 0.08 + (0.84 * k) / (a.length - 1);
        S1.onClick((x, y) => {
          if (Math.abs(y - TOP) > 0.12) return;
          let p = -1, bd = 0.06; a.forEach((_, k) => { const d = Math.abs(x - X(k)); if (d < bd) { bd = d; p = k; } });
          if (p < 0 || sel.includes(p)) return;
          sel = [sel[1], p].sort((s, t) => s - t);
        });
        let st = null;
        v.render(() => {
          const [p, q] = sel, xv = a[p], yv = a[q], b = a.slice(); b[p] = yv; b[q] = xv;
          const lo = Math.min(xv, yv), hi = Math.max(xv, yv);
          const d = {}; // change contributed by each in-between position
          for (let r = p + 1; r < q; r++) { const c = a[r]; d[r] = (+(yv > c) + +(c > xv)) - (+(xv > c) + +(c > yv)); }
          const dPair = (+(yv > xv)) - (+(xv > yv));
          const col = (r) => (r === p || r === q ? 'gold' : d[r] == null ? 'faint' : Math.abs(d[r]) === 2 ? 'orange' : Math.abs(d[r]) === 1 ? 'red' : 'muted');
          const wid = (r) => (r === p || r === q ? 4.5 : d[r] ? 3.5 : 2.2);
          const o = { top: TOP, bot: 0.2, fill: col, strand: col, width: wid, botColor: col };
          const before = strands(S1, a, o), after = strands(S2, b, o);
          // the swap arc and the changes
          const xp = X(p), xq = X(q), top = TOP + 0.075;
          S1.path([[xp, top], [xp, top + 0.05], [xq, top + 0.05], [xq, top]], { color: 'gold', width: 2 });
          S1.text(`${dPair > 0 ? '+' : dPair < 0 ? '−' : '±'}${Math.abs(dPair)}`, (xp + xq) / 2, top + 0.085, { align: 'center', size: 13, weight: 700, color: 'gold' });
          for (let r = p + 1; r < q; r++) S1.text(`${d[r] > 0 ? '+' : d[r] < 0 ? '−' : ''}${Math.abs(d[r])}`, X(r), top + 0.005, { align: 'center', size: 12.5, weight: 700, color: col(r) });
          const N0 = before.cr.length, N1 = after.cr.length, ch = N1 - N0;
          S1.tex(`N = ${N0},\\ \\ \\operatorname{sign} = ${N0 % 2 ? '-1' : '+1'}`, 0.5, 0.06, { size: 15, color: N0 % 2 ? 'red' : 'blue' });
          S2.tex(`N = ${N1},\\ \\ \\operatorname{sign} = ${N1 % 2 ? '-1' : '+1'}`, 0.5, 0.06, { size: 15, color: N1 % 2 ? 'red' : 'blue' });
          S2.corner(`change ${ch > 0 ? '+' : ch < 0 ? '−' : ''}${Math.abs(ch)}: ${ch % 2 ? 'odd' : 'even'}`, 'tr', { color: ch % 2 ? 'green' : 'red', weight: 700, size: 12.5 });
          st = { a, b, p, q, xv, yv, d, dPair, N0, N1, ch, lo, hi };
        });
        v.legend([['gold', 'swapped'], ['orange', 'in between, value between: $\\pm 2$'], ['muted', 'in between, otherwise: $0$'], ['faint', 'outside: unaffected'], ['red', 'equal to a swapped value: $\\pm 1$'], ['red', 'crossing', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { a, b, p, q, xv, yv, d, dPair, N0, N1, ch } = st;
          const parts = [`${dPair >= 0 ? '+' : ''}${dPair}\\ (\\text{the pair})`];
          for (let r = p + 1; r < q; r++) if (d[r]) parts.push(`${d[r] > 0 ? '+' : ''}${d[r]}\\ (\\text{entry } ${a[r]})`);
          const head = `Swapping the entries $${xv}$ and $${yv}$ turns $${ptex(a)}$ into $${ptex(b)}$: the crossings go from $${N0}$ to $${N1}$, a change of $${ch} = ${parts.join(' ')}$`;
          if (ch % 2) return `${head} (every other in-between entry contributes $0$) — odd, so the sign flips from $${N0 % 2 ? '-1' : '+1'}$ to $${N1 % 2 ? '-1' : '+1'}$.`;
          return `${head} — **even**. With a repeated entry the swap need not change the parity (and swapping two equal entries changes nothing at all), which is why signs are defined only for permutations.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.35
    {
      num: '9.35',
      kind: 'Theorem',
      name: 'Permutations and alternating multilinear forms',
      statement: String.raw`Suppose $m$ is a positive integer and $\alpha \in V^{(m)}_{\mathrm{alt}}$. Then
$$\alpha(v_{j_1}, \dots, v_{j_m}) = \big(\operatorname{sign}(j_1, \dots, j_m)\big)\,\alpha(v_1, \dots, v_m)$$
for every list $v_1, \dots, v_m$ of vectors in $V$ and every $(j_1, \dots, j_m) \in \operatorname{perm} m$.`,
      idea: String.raw`Sort $(j_1, \dots, j_m)$ back to $(1, \dots, m)$ by a sequence of swaps of entries, performing the same swaps on the inputs of $\alpha$. Each swap multiplies the value of $\alpha$ by $-1$ (9.30) and also the sign of the remaining permutation by $-1$ (9.34), so the product $\operatorname{sign}(\text{permutation}) \cdot \alpha(\text{inputs})$ never changes. At the end the permutation is $(1, \dots, m)$, of sign $1$, and the inputs are $v_1, \dots, v_m$.`,
      caption: String.raw`Drag $v_1, v_2, v_3$ (drag the background to rotate) and pick an order $(j_1, j_2, j_3)$ — buttons, or click a bar. The numbered badges on the arrows say which slot each vector occupies, and the box is coloured by the orientation of the list $v_{j_1}, v_{j_2}, v_{j_3}$: blue for the even orders, red for the odd ones. Right: the form on all six orders, each with its strand diagram; for the signed volume every value is $\pm\alpha(v_1, v_2, v_3)$ (dashed lines), with the sign of the permutation. A non-alternating form scatters the six values.`,
      deps: ['ladr-9.30', 'ladr-9.34'],
      tags: ['permutations', 'multilinear'],
      viz(v) {
        const S = v.stage({ x: [-1.45, 2.15], y: [-1.4, 2.1], equal: true, axes: false, height: 390, weight: 1.25, minWidth: 300 });
        const B = v.stage({ x: [-0.05, 6.05], y: [-1.85, 1.3], axes: false, height: 390, minWidth: 290, title: 'the form on all six orders of the inputs' });
        const sc = v.scene3(S, { yaw: -0.62, pitch: 0.3, axis: 1.5, lim: 1.5 });
        const fs = formSelect(v);
        const PS = perms(3);
        const ps = v.select('order', PS.map((p, i) => ({ value: String(i), label: `$${ptex(p)}$` })), '5');
        B.onClick((x) => { const i = Math.floor(x); if (i >= 0 && i < 6) ps.set(String(i)); });
        const V0 = [[1.05, 0.1, 0.05], [-0.1, 1.0, 0.4], [0.15, 0.3, 0.95]];
        const H = V0.map((p, k) => sc.handle(p, { color: CC[k], label: `v${sb(k + 1)}` }));
        let st = null;
        v.render(() => {
          const F = FORMS[fs.value].f, V = H.map((h) => h.p), sel = +ps.value, jp = PS[sel], X = jp.map((j) => V[j - 1]);
          const base = F(...V), vals = PS.map((p) => F(...p.map((j) => V[j - 1])));
          const volX = det3(...X), oc = oriCol(volX);
          sc.begin();
          pped(sc, V[0], V[1], V[2], { fill: oc, color: oc, fillAlpha: 0.08, alpha: 0.45 });
          V.forEach((x, k) => sc.arrow(ZERO, x, { color: CC[k], width: 3.2 }));
          sc.flush();
          X.forEach((x, k) => badge(S, sc, scl(x, 0.8), k + 1, CC[jp[k] - 1]));
          S.corner(`slots 1, 2, 3 (badges) hold v${sb(jp[0])}, v${sb(jp[1])}, v${sb(jp[2])}`, 'tl', { color: 'muted', weight: 700 });
          // the bars
          const Y = Math.max(0.2, Math.abs(base), ...vals.map(Math.abs));
          for (const yy of [base, -base]) B.line(0, yy / Y, 6, yy / Y, { color: yy === base ? 'blue' : 'red', dash: [6, 4], width: 1.2, alpha: 0.8 });
          B.line(0, 0, 6, 0, { color: 'muted', width: 1 });
          PS.forEach((p, i) => {
            const s = sign(p), h = vals[i] / Y, c = s > 0 ? 'blue' : 'red';
            B.rect(i + 0.22, 0, i + 0.78, h, { fill: c, fillAlpha: i === sel ? 0.75 : 0.4, color: i === sel ? 'gold' : c, width: i === sel ? 3 : 1 });
            B.text(pn(vals[i], 2), i + 0.5, h / 2, { align: 'center', size: 11.5, color: 'ink', weight: 600 });
            // the strand diagram of this order: slot k (top) ← v_{j_k} (bottom)
            const xs = (k) => i + 0.25 + 0.25 * k;
            for (let k = 0; k < 3; k++) B.line(xs(k), -1.32, xs(p[k] - 1), -1.68, { color: CC[p[k] - 1], width: 2.4 });
            for (let k = 0; k < 3; k++) { B.dot(xs(k), -1.32, { r: 3, color: CC[p[k] - 1] }); B.dot(xs(k), -1.68, { r: 3, color: CC[k] }); }
            B.text(s > 0 ? '+1' : '−1', i + 0.5, -1.17, { align: 'center', size: 12, weight: 700, color: c });
            B.text(p.join(''), i + 0.5, -1.8, { align: 'center', size: 11, color: i === sel ? 'gold' : 'muted', weight: i === sel ? 700 : 500 });
          });
          st = { jp, val: vals[sel], base, vals, alt: FORMS[fs.value].alt };
        });
        v.legend([['blue', 'even order, sign $+1$', { area: true }], ['red', 'odd order, sign $-1$', { area: true }], ['blue', '$\\alpha(v_1, v_2, v_3)$', { dash: true }], ['red', '$-\\alpha(v_1, v_2, v_3)$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { jp, val, base, vals, alt } = st, s = sign(jp);
          const ok = Math.abs(val - s * base) < 1e-9;
          const head = `$\\alpha(v_{${jp[0]}}, v_{${jp[1]}}, v_{${jp[2]}}) = ${tn(val, 3)}$ and $\\operatorname{sign}${ptex(jp)}\\cdot\\alpha(v_1, v_2, v_3) = (${s > 0 ? '+1' : '-1'})(${tn(base, 3)}) = ${tn(s * base, 3)}$`;
          if (alt) return `${head}: ${ok ? 'equal' : 'different'}. All six values are $\\pm ${tn(Math.abs(base), 3)}$, the sign being that of the permutation.`;
          return `${head}: ${ok ? 'equal here by accident' : '**different**'} — the six values ${vals.map((x) => `$${tn(x, 2)}$`).join(', ')} are not $\\pm$ one number, because this form is not alternating.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.36
    {
      num: '9.36',
      kind: 'Theorem',
      name: 'Formula for (dim V)-linear alternating forms',
      statement: String.raw`Let $n = \dim V$. Suppose $e_1, \dots, e_n$ is a basis of $V$ and $v_1, \dots, v_n \in V$, and write $v_k = \sum_{j=1}^n b_{j,k}\,e_j$ for $k = 1, \dots, n$. Then
$$\alpha(v_1, \dots, v_n) = \alpha(e_1, \dots, e_n) \sum_{(j_1, \dots, j_n) \in \operatorname{perm} n} \big(\operatorname{sign}(j_1, \dots, j_n)\big)\, b_{j_1,1} \cdots b_{j_n,n}$$
for every alternating $n$-linear form $\alpha$ on $V$.`,
      idea: String.raw`Expand $\alpha\big(\sum_{j_1} b_{j_1,1}e_{j_1}, \dots, \sum_{j_n} b_{j_n,n}e_{j_n}\big)$ by linearity in each slot: this gives $n^n$ terms $b_{j_1,1} \cdots b_{j_n,n}\,\alpha(e_{j_1}, \dots, e_{j_n})$, one for each list of indices. If two indices coincide, a basis vector is repeated and the term is $0$ because $\alpha$ is alternating; only the $n!$ lists that are permutations survive. For those, $\alpha(e_{j_1}, \dots, e_{j_n}) = \operatorname{sign}(j_1, \dots, j_n)\,\alpha(e_1, \dots, e_n)$ by 9.35. So an alternating $n$-form is determined by its single value on one basis.`,
      caption: String.raw`Edit the coordinates $b_{j,k}$ (click the top or bottom half of an entry, or drag it): column $k$ holds the coordinates of $v_k$ in the basis $e_1, \dots, e_n$, a fixed skewed basis of $\mathbf R^n$. Here $\alpha$ is the multiple of signed volume with the value $\alpha(e_1, \dots, e_n)$ set by the slider. Right: all $n^n$ terms $b_{j_1,1}\cdots b_{j_n,n}\,\alpha(e_{j_1}, \dots, e_{j_n})$ of the full expansion. Terms with a repeated index are $0$ (no fill); the $n!$ permutation terms are blue or red by sign, and they alone add up to $\alpha(v_1, \dots, v_n)$, computed independently. Choose *a non-alternating* $\beta$ (random values on basis lists): the repeated-index terms (orange) no longer vanish, and the permutation formula gives the wrong answer.`,
      deps: ['ladr-9.35', 'ladr-9.27'],
      tags: ['multilinear', 'permutations'],
      viz(v) {
        const M = v.M;
        const nS = v.select('', [{ value: '2', label: '$n = 2$' }, { value: '3', label: '$n = 3$' }], '3');
        const fS = v.select('', [{ value: 'alt', label: 'alternating $\\alpha$' }, { value: 'not', label: 'a non-alternating $\\beta$' }], 'alt');
        const cS = v.slider('$\\alpha(e_1, \\dots, e_n)$', -2, 2, 1, { step: 0.1 });
        const E = { 2: [[1, 0.3], [-0.4, 1]], 3: [[1, 0.2, 0], [0.3, 1, 0.1], [0, -0.4, 1]] }; // basis vectors (rows here = the e_j)
        const Bm = { 2: [[2, 1], [-1, 1]], 3: [[2, 1, -1], [-1, 1, 2], [1, 3, 1]] };
        const r = v.rng(5), BETA = { 2: randTensor(r, 2, 2, -2, 2), 3: randTensor(r, 3, 3, -2, 2) };
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, minWidth: 230, title: 'coordinates: $v_k = \\sum_j b_{j,k}\\,e_j$' });
        const G = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1.9, minWidth: 420, title: 'the full expansion: one term per list $(j_1, \\dots, j_n)$' });
        const TB = v.table(A, { rows: 3, cols: 3, region: [0.04, 0.34, 0.96, 0.96], maxCell: 54, size: 16, rowLabels: (j) => `$e_${j + 1}$`, colLabels: (k) => `$v_${k + 1}$` });
        const TG = [0, 1, 2].map(() => v.table(G, { rows: 3, cols: 3, maxCell: 44, size: 12.5, rowLabels: (j) => `$${j + 1}$`, colLabels: (j) => `$${j + 1}$` }));
        // editable coordinates (click the upper/lower half of a cell, or drag it)
        let drag = null;
        A.onDrag((x, y, ph) => {
          const n = +nS.value;
          if (ph === 'start') { const c = TB.geo ? TB.hit(x, y) : null; drag = c && c.i >= 0 && c.j >= 0 && c.i < n && c.j < n ? { ...c, Y: A.Y(y), done: 0, moved: false } : null; return; }
          if (!drag) return;
          const bump = (k) => { Bm[n][drag.i][drag.j] = M.clamp(Bm[n][drag.i][drag.j] + k, -4, 4); };
          const dy = drag.Y - A.Y(y);
          if (ph === 'move' && (drag.moved || Math.abs(dy) > 5)) { drag.moved = true; const k = Math.round(dy / 14); if (k !== drag.done) { bump(k - drag.done); drag.done = k; } }
          if (ph === 'end') { if (!drag.moved) { const rc = TB.cellRect(drag.i, drag.j); bump(y > (rc[1] + rc[3]) / 2 ? 1 : -1); } drag = null; }
        });
        let st = null;
        v.render(() => {
          const n = +nS.value, alt = fS.value === 'alt', B = Bm[n], c = cS.value, Ev = E[n];
          cS.el.hidden = !alt;
          const detE = n === 2 ? det2(Ev[0], Ev[1]) : det3(Ev[0], Ev[1], Ev[2]);
          // the form on standard coordinates: α = (c / det E)·(signed volume), or β given by its values on basis lists
          const vol = (xs) => (n === 2 ? det2(xs[0], xs[1]) : det3(xs[0], xs[1], xs[2]));
          const onBasis = (js) => (alt ? (c / detE) * vol(js.map((j) => Ev[j])) : BETA[n][js.join('')]);
          const vk = [...Array(n).keys()].map((k) => Ev.reduce((s, e, j) => add(s, scl(e, B[j][k])), Array(n).fill(0)));
          const direct = alt ? (c / detE) * vol(vk) : multi(BETA[n], n, [...Array(n).keys()].map((k) => B.map((row) => row[k])));
          TB.draw({ rows: n, cols: n, value: (i, j) => B[i][j], fill: (i, j) => [['orange', 'purple', 'teal'][j], 0.18], size: 16 });
          A.text('basis of R' + (n === 2 ? '²' : '³') + ':', 0.06, 0.27, { size: 12, color: 'muted' });
          Ev.forEach((e, j) => A.tex(`e_${j + 1} = ${vtex(e, 1)}`, 0.06, 0.2 - 0.065 * j, { align: 'left', size: 13, color: 'muted' }));
          // all n^n terms
          const tuples = []; const rec = (pre) => { if (pre.length === n) { tuples.push(pre); return; } for (let j = 0; j < n; j++) rec([...pre, j]); }; rec([]);
          const val = {}; let full = 0, permSum = 0, repSum = 0;
          for (const js of tuples) {
            const coef = js.reduce((s, j, k) => s * B[j][k], 1), x = coef * onBasis(js);
            val[js.join('')] = x; full += x;
            const isPerm = new Set(js).size === n;
            if (isPerm) permSum += sign(js.map((j) => j + 1)) * coef; else repSum += x;
          }
          const atBasis = onBasis([...Array(n).keys()]), formula = atBasis * permSum;
          const kind = (js) => (new Set(js).size === n ? (sign(js.map((j) => j + 1)) > 0 ? 'blue' : 'red') : null);
          const fill = (js) => { const k = kind(js), x = val[js.join('')]; return k ? [k, 0.28] : !alt && Math.abs(x) > 1e-9 ? ['orange', 0.35] : null; };
          const tcol = (js) => (kind(js) || (Math.abs(val[js.join('')]) > 1e-9 ? 'ink' : 'faint'));
          if (n === 3) {
            TG.forEach((T, b) => {
              T.draw({ rows: 3, cols: 3, region: [0.01 + 0.33 * b, 0.27, 0.33 + 0.33 * b, 0.86], value: (i, j) => val[`${b}${i}${j}`], format: (x) => pn(x, 2), fill: (i, j) => fill([b, i, j]), textColor: (i, j) => tcol([b, i, j]) });
              const g = T.geo; if (g) G.texPx(`j_1 = ${b + 1}`, g.X0 + (3 * g.cw) / 2, g.Y0 - g.lh - 12, { size: 14, color: 'ink' });
            });
            G.text('in each block: rows j₂, columns j₃', 0.5, 0.955, { align: 'center', size: 12, color: 'muted' });
          } else {
            TG[0].draw({ rows: 2, cols: 2, region: [0.25, 0.27, 0.75, 0.86], value: (i, j) => val[`${i}${j}`], format: (x) => pn(x, 2), fill: (i, j) => fill([i, j]), textColor: (i, j) => tcol([i, j]) });
            G.text('rows j₁, columns j₂', 0.5, 0.955, { align: 'center', size: 12, color: 'muted' });
          }
          const nn = n ** n, nf = n === 2 ? 2 : 6, F = alt ? '\\alpha' : '\\beta', es = n === 2 ? 'e_1, e_2' : 'e_1, e_2, e_3', vs = n === 2 ? 'v_1, v_2' : 'v_1, v_2, v_3';
          G.tex(`\\text{sum of all } ${nn} \\text{ terms} = ${F}(${vs}) = ${tn(full, 3)}`, 0.5, 0.16, { size: 14.5 });
          const ok = Math.abs(formula - direct) < 1e-9 * Math.max(1, Math.abs(direct));
          G.tex(`${F}(${es})\\sum_{\\text{${nf} perms}} \\operatorname{sign}\\cdot b\\cdots b = ${zt(atBasis)}\\cdot ${zt(permSum)} = ${tn(formula, 3)}`, 0.5, 0.06, { size: 14.5, color: ok ? 'green' : 'red' });
          st = { n, alt, full, direct, formula, permSum, atBasis, repSum, ok, nn, nf, es, vs };
        });
        v.legend([['blue', 'permutation, sign $+1$', { area: true }], ['red', 'permutation, sign $-1$', { area: true }], ['orange', 'repeated index, nonzero', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { alt, direct, formula, permSum, atBasis, repSum, ok, nn, nf, es, vs } = st;
          if (alt) return `Of the $${nn}$ terms, the $${nn - nf}$ with a repeated index vanish ($\\alpha$ is alternating) and the $${nf}$ permutation terms give $\\alpha(${es}) \\cdot ${zt(permSum)} = ${tn(formula, 3)}$, which ${ok ? 'matches' : 'differs from'} $\\alpha(${vs}) = ${tn(direct, 3)}$ computed directly from the vectors as $\\alpha(e_1, \\dots, e_n)\\,\\mathrm{vol}(v_1, \\dots, v_n)/\\mathrm{vol}(e_1, \\dots, e_n)$, with $\\mathrm{vol}$ the signed volume.`;
          return `$\\beta$ is multilinear, so all $${nn}$ terms still add up to $\\beta(${vs}) = ${tn(direct, 3)}$; but the repeated-index terms contribute $${tn(repSum, 3)}$ and the permutation terms are not $\\pm\\beta(${es})$, so the formula gives $${zt(atBasis)}\\cdot ${zt(permSum)} = ${tn(formula, 3)}$ — ${ok ? 'equal only by accident' : '**wrong**'}.`;
        });
      },
    },
  ],
};
