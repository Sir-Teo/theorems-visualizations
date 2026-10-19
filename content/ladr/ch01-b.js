// Axler, Linear Algebra Done Right (4th ed.) — Chapter 1: Vector Spaces
// Part 2: (−1)v = −v, subspaces, sums and direct sums (1.32–1.46). Part 1 is ch01.js.

// ---------- shared helpers ----------
/** A number for TeX with d decimals and no "-0". */
function tn(x, d = 2) { return (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d); }
/** A list (x₁,…,xₙ) for TeX. */
const vtex = (p, d = 2) => `(${p.map((x) => tn(x, d)).join(',\\ ')})`;
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => { const n = Math.hypot(...a) || 1; return a.map((c) => c / n); };
/** Orthonormal pair spanning the plane through 0 with normal n. */
function planeBasis(n) { const t = Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]; const a = unit(cross3(t, n)); return [a, cross3(n, a)]; }
/** Angle in degrees between a line (direction d) and a plane (normal n). */
const lineplaneDeg = (d, n) => (Math.asin(Math.min(1, Math.abs(dot3(unit(d), n)))) * 180) / Math.PI;
/** Angle in degrees between two lines through 0 (0…90). */
const linelineDeg = (d, e) => (Math.acos(Math.min(1, Math.abs(dot3(unit(d), unit(e))))) * 180) / Math.PI;
/** Arrow p → q on a 2D stage with an optional KaTeX label just beyond the tip. */
function arrow2(S, p, q, color, label, o = {}) {
  S.arrow(p[0], p[1], q[0], q[1], { color, width: o.width ?? 2.6, head: o.head ?? 10, dash: o.dash, alpha: o.alpha });
  if (label) {
    const dx = S.X(q[0]) - S.X(p[0]), dy = S.Y(q[1]) - S.Y(p[1]), L = Math.hypot(dx, dy) || 1, off = o.off ?? 15;
    S.tex(label, q[0], q[1], { color, size: o.size ?? 15, dx: (dx / L) * off + (o.dx || 0), dy: (dy / L) * off + (o.dy || 0) });
  }
}
/**
 * Show exactly the stages flagged true and resize every listed visible stage at once. (The runtime's .stage
 * display rule overrides the bare hidden attribute, and its ResizeObserver watches only the whole viz, so a stage
 * shown again — or widened because a neighbour vanished — would otherwise keep its old canvas size.)
 * Called from the mode select's onChange and once during setup, never inside a draw.
 */
function layout(v, list) {
  for (const [S, on] of list) { S.el.hidden = !on; S.el.style.display = on ? '' : 'none'; }
  for (const [S, on] of list) if (on && typeof S.resize === 'function') S.resize();
  v.invalidate();
}
const disc = (r) => (x, y) => { const n = Math.hypot(x, y); return n > r ? [(x * r) / n, (y * r) / n] : [x, y]; };
/** A log₂-scale number line for (0,∞) with ticks 1/8 … 8 and the zero vector 1 marked. */
function logLine(S, y0 = 0, top = 2.5, note) {
  S.line(S.bounds.x[0] + 0.1, y0, S.bounds.x[1] - 0.1, y0, { color: 'muted', width: 1.4 });
  for (let k = -3; k <= 3; k++) { S.line(k, y0 - 0.08, k, y0 + 0.08, { color: 'muted', width: 1 }); S.text(k < 0 ? `1/${2 ** -k}` : String(2 ** k), k, y0 - 0.32, { align: 'center', size: 11.5, color: 'muted' }); }
  S.line(0, y0 - 0.15, 0, top, { color: 'green', width: 1.5, dash: [4, 4] });
  S.text('zero vector = 1', 0.08, top - 0.08, { size: 11.5, color: 'green' });
  if (note) S.text(note, S.bounds.x[0] + 0.1, y0 - 0.62, { size: 11, color: 'muted' });
}

/**
 * A rotatable 3D picture drawn on a 2D stage, so that vectors in ℝ³ can carry draggable handles
 * (the runtime's stage3d has none). Orthographic view, yaw about the vertical axis then pitch, like stage3d;
 * painter's algorithm: fills and line pieces sorted by depth, then arrows/dots on top. Drag the background to rotate.
 * Handles: mode 'free' (moves parallel to the screen), 'plane' (stays in span{a, b}), 'line' (stays on span{d}).
 */
function scene3(v, S, o = {}) {
  const M = v.M;
  const sc = { yaw: o.yaw ?? -0.62, pitch: o.pitch ?? 0.34, L: o.axis ?? 1.5, lim: o.lim ?? 1.45, labels: o.labels ?? ['x', 'y', 'z'], q: [], top: [], hs: [] };
  let ex = [1, 0, 0], ey = [0, 0, 1], ez = [0, 1, 0];
  const basis = () => {
    const cy = Math.cos(sc.yaw), sy = Math.sin(sc.yaw), cp = Math.cos(sc.pitch), sp = Math.sin(sc.pitch);
    ex = [cy, -sy, 0]; ey = [sy * sp, cy * sp, cp]; ez = [sy * cp, cy * cp, -sp]; // ez points away from the viewer
  };
  basis();
  const P = (sc.P = (p) => [p[0] * ex[0] + p[1] * ex[1] + p[2] * ex[2], p[0] * ey[0] + p[1] * ey[1] + p[2] * ey[2], p[0] * ez[0] + p[1] * ez[1] + p[2] * ez[2]]);
  let last = null;
  S.onDrag((x, y, ph) => {
    const X = S.X(x), Y = S.Y(y);
    if (ph === 'start' || !last) { last = [X, Y]; return; }
    sc.yaw -= (X - last[0]) * 0.01; sc.pitch = M.clamp(sc.pitch + (Y - last[1]) * 0.01, -1.45, 1.45);
    last = ph === 'end' ? null : [X, Y];
  });
  const push = (d, f, top) => (top ? sc.top : sc.q).push({ d, f });
  sc.begin = () => { basis(); sc.q = []; sc.top = []; for (const H of sc.hs) H.sync(); if (o.axes !== false) sc.axes(); };
  sc.line = (p, q, st = {}, n = 10) => {
    if (st.dash) n = 1;
    for (let i = 0; i < n; i++) {
      const A = P(M.vlerp(p, q, i / n)), B = P(M.vlerp(p, q, (i + 1) / n));
      push((A[2] + B[2]) / 2 + (st.bias || 0), () => S.line(A[0], A[1], B[0], B[1], st), st.top);
    }
    return sc;
  };
  sc.path = (pts, st = {}) => {
    for (let i = 0; i + 1 < pts.length; i++) sc.line(pts[i], pts[i + 1], st, st.n ?? 1);
    if (st.close && pts.length > 2) sc.line(pts[pts.length - 1], pts[0], st, st.n ?? 1);
    return sc;
  };
  sc.poly = (pts, st = {}) => {
    const Q = pts.map(P), d = Q.reduce((s, p) => s + p[2], 0) / Q.length;
    push(d + (st.bias || 0), () => S.poly(Q.map((p) => [p[0], p[1]]), { fill: st.fill || st.color || 'accent', fillAlpha: st.fillAlpha ?? 0.16, stroke: false }), st.top);
    if (st.edge !== false) sc.path(pts, { color: st.color || st.fill, width: st.width ?? 1.2, alpha: st.alpha ?? 0.7, close: true, bias: st.bias });
    return sc;
  };
  /** Disc of radius r centred at c in the plane spanned by orthonormal a, b. */
  sc.disc = (a, b, r, st = {}, c = [0, 0, 0]) => {
    const pts = [];
    for (let k = 0; k < 60; k++) { const t = (2 * Math.PI * k) / 60; pts.push(c.map((ci, i) => ci + r * (Math.cos(t) * a[i] + Math.sin(t) * b[i]))); }
    sc.poly(pts, st);
    if (st.grid) for (const s of [-0.5, 0, 0.5]) {
      const h = r * Math.sqrt(1 - s * s);
      sc.line(c.map((ci, i) => ci + s * r * a[i] - h * b[i]), c.map((ci, i) => ci + s * r * a[i] + h * b[i]), { color: st.color, width: 0.8, alpha: 0.3 }, 6);
      sc.line(c.map((ci, i) => ci + s * r * b[i] - h * a[i]), c.map((ci, i) => ci + s * r * b[i] + h * a[i]), { color: st.color, width: 0.8, alpha: 0.3 }, 6);
    }
    return sc;
  };
  sc.arrow = (p, q, st = {}) => { const A = P(p), B = P(q); push(B[2] + (st.bias || 0), () => S.arrow(A[0], A[1], B[0], B[1], { width: 2.6, head: 10, ...st }), st.top ?? true); return sc; };
  sc.dot = (p, st = {}) => { const A = P(p); push(A[2] - 0.01 + (st.bias || 0), () => S.dot(A[0], A[1], st), st.top ?? true); return sc; };
  sc.tex = (s, p, st = {}) => { const A = P(p); S.tex(s, A[0], A[1], st); return sc; };
  sc.axes = () => {
    const L = sc.L;
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach((e, i) => {
      sc.line(e.map((t) => -t * L), e.map((t) => t * L), { color: 'faint', width: 1 }, 8);
      for (const k of [-1, 1]) { const A = P(e.map((t) => t * k)); push(A[2], () => S.dot(A[0], A[1], { r: 2, color: 'faint', ring: false }), false); }
      const A = P(e.map((t) => t * L * 1.1));
      push(-1e8, () => S.text(sc.labels[i], A[0], A[1], { math: true, color: 'muted', align: 'center', size: 15 }), true);
    });
  };
  sc.flush = () => {
    sc.q.sort((a, b) => b.d - a.d); for (const it of sc.q) it.f();
    sc.top.sort((a, b) => b.d - a.d); for (const it of sc.top) it.f();
    sc.q = []; sc.top = [];
    if (o.hint !== false) S.corner('drag the background to rotate', 'br', { size: 11, color: 'faint' });
  };
  sc.handle = (p0, st = {}) => {
    const H = { p: p0.slice(), mode: st.mode || 'free', a: st.a, b: st.b, d: st.d, t: 0, lim: st.lim ?? sc.lim, snap: st.snap || null };
    if (H.mode === 'line') H.t = M.dot(p0, H.d) / M.dot(H.d, H.d);
    H.solve = (x, y) => {
      let p;
      if (H.mode === 'line') {
        const Pd = P(H.d), n2 = Pd[0] ** 2 + Pd[1] ** 2; if (n2 < 1e-3) return H.p;
        let t = (x * Pd[0] + y * Pd[1]) / n2; const m = Math.max(...H.d.map(Math.abs)) * Math.abs(t); if (m > H.lim) t *= H.lim / m;
        H.t = t; p = H.d.map((c) => c * t);
      } else if (H.mode === 'plane') {
        const Pa = P(H.a), Pb = P(H.b), det = Pa[0] * Pb[1] - Pa[1] * Pb[0]; if (Math.abs(det) < 0.04) return H.p;
        const s = (x * Pb[1] - y * Pb[0]) / det, t = (Pa[0] * y - Pa[1] * x) / det;
        p = H.a.map((c, i) => s * c + t * H.b[i]);
        const m = Math.max(...p.map(Math.abs)); if (m > H.lim) p = p.map((c) => (c * H.lim) / m);
      } else {
        const A = P(H.p); p = H.p.map((c, i) => M.clamp(c + (x - A[0]) * ex[i] + (y - A[1]) * ey[i], -H.lim, H.lim));
      }
      if (H.snap) p = H.snap(p) || p;
      if (H.mode === 'line') H.t = M.dot(p, H.d) / M.dot(H.d, H.d);
      return p;
    };
    H.h = S.handle(0, 0, { color: st.color || 'accent', r: st.r ?? 6.5, label: st.label, labelPos: st.labelPos, constrain: (x, y) => { H.p = H.solve(x, y); const A = P(H.p); return [A[0], A[1]]; } });
    H.sync = () => { if (H.mode === 'line') H.p = H.d.map((c) => c * H.t); const A = P(H.p); H.h.x = A[0]; H.h.y = A[1]; };
    H.set = (p) => { H.p = p.slice(); if (H.mode === 'line') H.t = M.dot(p, H.d) / M.dot(H.d, H.d); H.sync(); v.invalidate(); };
    sc.hs.push(H);
    return H;
  };
  return sc;
}
/** Draw the line through 0 with direction d as a thick translucent stroke. */
function line3(sc, d, color, len = 1.7, st = {}) { const u = unit(d); sc.line(scl3(u, -len), scl3(u, len), { color, width: st.width ?? 4, alpha: st.alpha ?? 0.45, bias: st.bias }, 14); }

export default {
  collection: 'ladr',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.32
    {
      num: '1.32',
      kind: 'Theorem',
      name: 'The number −1 times a vector',
      statement: String.raw`In every vector space $V$, $(-1)v=-v$ for all $v\in V$: multiplying by the scalar $-1$ produces the additive inverse.`,
      idea: String.raw`Compute $v+(-1)v=1v+(-1)v=(1+(-1))v=0v=0$, using the multiplicative identity, the distributive property and Theorem 1.30. So $(-1)v$ is *an* additive inverse of $v$, and since additive inverses are unique (Theorem 1.27) it is *the* additive inverse $-v$.`,
      caption: String.raw`Slide the scalar $a$ and drag $v$. The purple arrow is $av$; laid tip to tail after $v$ it ends at $v+av=(1+a)v$. The graph on the right is the distance from $v+av$ to $0$: it touches $0$ only at $a=-1$. In $(0,\infty)$ with $x\oplus y=xy$ and $a\odot x=x^a$ (drawn on a log scale, where it becomes ordinary arithmetic), $(-1)\odot v=1/v$ — and $v\oplus\frac1v=1$, the zero vector there.`,
      deps: ['ladr-1.30', 'ladr-1.27'],
      tags: ['vector spaces'],
      viz(v) {
        const M = v.M;
        const sp = v.select('', [{ value: 'R2', label: '$\\R^2$' }, { value: 'pos', label: '$(0,\\infty)$: $x\\oplus y=xy$, $a\\odot x=x^a$' }], 'R2', { onChange: () => relayout() });
        const sa = v.slider('$a$', -3, 2, -0.6, { step: 0.01 });
        v.button('set $a=-1$', () => sa.set(-1));
        const S = v.stage({ x: [-2.4, 2.4], y: [-2, 2], equal: true, height: 360, ticks: false, weight: 1.25 });
        const NL = v.stage({ x: [-3.3, 3.3], y: [-0.75, 2.75], height: 360, axes: false, weight: 1.25 });
        const G = v.stage({ x: [-3, 2], y: [-0.2, 4], height: 360, axes: 'box', weight: 0.85, minWidth: 230, xlabel: 'a', title: 'distance from $v+av$ to $0$' });
        const relayout = () => layout(v, [[S, sp.value === 'R2'], [NL, sp.value === 'pos'], [G, true]]);
        relayout();
        const V = S.handle(1.3, 0.8, { color: 'blue', label: 'v', constrain: disc(1.8) });
        const VL = NL.handle(1.4, 2.0, { color: 'blue', constrain: (x) => [M.clamp(x, -2.4, 2.4), 2.0] });
        let st = {};
        v.render(() => {
          const m = sp.value, a = sa.value, zero = Math.abs(1 + a) < 1e-9;
          // ---- ℝ²
          const p = [V.x, V.y], ap = [a * p[0], a * p[1]], s = [(1 + a) * p[0], (1 + a) * p[1]];
          S.dot(-p[0], -p[1], { r: 10, color: 'green', alpha: 0.18 }); S.tex('-v', -p[0], -p[1], { color: 'green', dx: 18, dy: 14, size: 14 });
          arrow2(S, [0, 0], p, 'blue');
          arrow2(S, [0, 0], ap, 'purple', 'av', { width: 2.4 });
          arrow2(S, p, s, 'purple', null, { dash: [5, 4], alpha: 0.65, width: 2 });
          S.dot(s[0], s[1], { r: 5.5, color: zero ? 'green' : 'gold' });
          S.tex('v+av', s[0], s[1], { color: zero ? 'green' : 'gold', dx: 26, dy: -12, size: 14 });
          S.dot(0, 0, { r: 3.5, color: 'ink' });
          S.corner(zero ? 'a = −1:  v + (−1)v = 0' : `a = ${v.fix(a, 2)}`, 'tl', { color: zero ? 'green' : 'muted', weight: 600 });
          // ---- (0,∞) on a log scale: positions are log₂ x, and the operations become + and ·
          logLine(NL, 0, 2.6, 'log scale: x ⊕ y = xy adds logs, a ⊙ x = xᵃ multiplies the log by a');
          const t = VL.x, rows = [[2.0, t, 'blue', `v = ${tn(2 ** t)}`], [1.3, a * t, 'purple', `a ⊙ v = vᵃ = ${tn(2 ** (a * t), 3)}`], [0.6, (1 + a) * t, zero ? 'green' : 'gold', `v ⊕ (a ⊙ v) = ${tn(2 ** ((1 + a) * t), 3)}`]];
          rows.forEach(([y, x, col, lab], k) => {
            NL.line(-3.2, y, 3.2, y, { color: 'grid', width: 1 });
            if (Math.abs(x) > 0.02) NL.arrow(0, y, x, y, { color: col, width: 2.4, head: 8 });
            if (k) NL.dot(x, y, { r: 5, color: col });
            NL.text(lab, -3.2, y + 0.24, { size: 11.5, color: col });
          });
          // ---- the distance graph
          const nv = m === 'R2' ? Math.hypot(...p) : Math.abs(t);
          const f = (x) => Math.abs(1 + x) * nv, top = Math.max(1, f(-3) * 1.12);
          G.setView([-3, 2], [-0.06 * top, top]);
          G.vline(-1, { color: 'green', width: 1.2, dash: [4, 4] });
          G.fn(f, { color: 'accent', width: 2.5 });
          G.dot(-1, 0, { r: 4, color: 'green' }); G.tex('a=-1', -1, top, { color: 'green', size: 13, align: 'left', baseline: 'top', dx: 5, dy: 4 });
          G.dot(a, f(a), { r: 5.5, color: zero ? 'green' : 'gold' });
          st = { m, a, p, s, t, zero };
        });
        v.readout(() => {
          const { m, a, p, s, t, zero } = st; if (!m) return '';
          if (m === 'pos') {
            const x = 2 ** t;
            return `$(-1)\\odot v = v^{-1} = ${tn(1 / x, 3)}$, and $v\\oplus v^{-1} = ${tn(x, 2)}\\cdot${tn(1 / x, 3)} = 1$, the zero vector of this space — so $(-1)\\odot v$ is the additive inverse of $v$. Now $a=${tn(a)}$: $v\\oplus(a\\odot v) = v^{1+a} = ${tn(2 ** ((1 + a) * t), 3)}$` + (zero ? ' $=1$.' : ` $\\ne 1$ unless $a=-1$ (or $v=1$).`);
          }
          return `$(-1)v = ${vtex([-p[0], -p[1]])} = -v$, since $v+(-1)v = 1v+(-1)v = (1+(-1))v = 0v = 0$. Now $a = ${tn(a)}$: $v+av = (1+a)v = ${vtex(s)}$` + (zero ? ' $= 0$ — this $av$ is the additive inverse, and by uniqueness the only one.' : ', which is $0$ only for $a=-1$ (when $v\\ne0$).');
        });
      },
    },
    // ------------------------------------------------------------------ 1.33
    {
      num: '1.33',
      kind: 'Definition',
      name: 'Subspace',
      statement: String.raw`A subset $U$ of a vector space $V$ is a *subspace* of $V$ (or *linear subspace*) if $U$ is itself a vector space with the same additive identity, the same addition and the same scalar multiplication as $V$.`,
      idea: String.raw`Most of the axioms are inherited automatically, because they are identities that already hold for all elements of $V$. What can go wrong is that the operations lead *out* of $U$ — a sum or a multiple of elements of $U$ landing outside — or that $U$ misses the zero vector. In $\R^3$ the subspaces turn out to be exactly $\{0\}$, the lines through $0$, the planes through $0$ and $\R^3$ itself.`,
      caption: String.raw`Pick a subset $U$ of $\R^3$ (drag the background to rotate). Random pairs $u,w\in U$ and scalars $\lambda$ are drawn with their sums $u+w$ (green if they stay in $U$) and multiples $\lambda u$ (teal if they stay); escapes are red. The highlighted pair is the first counterexample, if there is one. Only the plane and the line through $0$ keep everything inside.`,
      deps: ['ladr-1.20'],
      tags: ['subspaces'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Linear_subspace' },
      viz(v) {
        const n0 = unit([0.3, -0.4, 1]), [a0, b0] = planeBasis(n0), d0 = unit([1, 0.55, 0.45]);
        const n2 = unit([-0.8, 0.15, 0.5]), [a2, b2] = planeBasis(n2);
        const inPlane = (r, a, b, s, c = [0, 0, 0]) => add3(c, add3(scl3(a, r.uniform(-s, s)), scl3(b, r.uniform(-s, s))));
        const SETS = {
          plane: { label: 'plane through $0$', member: (p) => Math.abs(dot3(p, n0)) < 1e-9, sample: (r) => inPlane(r, a0, b0, 0.85) },
          line: { label: 'line through $0$', member: (p) => len3(cross3(p, d0)) < 1e-9, sample: (r) => scl3(d0, r.uniform(-1, 1)) },
          off: { label: 'plane missing $0$', member: (p) => Math.abs(dot3(p, n0) - 0.55) < 1e-9, sample: (r) => inPlane(r, a0, b0, 0.75, scl3(n0, 0.55)) },
          two: { label: 'two planes (union)', member: (p) => Math.abs(dot3(p, n0)) < 1e-9 || Math.abs(dot3(p, n2)) < 1e-9, sample: (r) => (r() < 0.5 ? inPlane(r, a0, b0, 0.85) : inPlane(r, a2, b2, 0.85)) },
          cone: { label: 'cone $x^2+y^2=z^2$', member: (p) => Math.abs(p[0] * p[0] + p[1] * p[1] - p[2] * p[2]) < 1e-9, sample: (r) => { const t = r.uniform(0, 2 * Math.PI), h = r.uniform(-0.85, 0.85); return [h * Math.cos(t), h * Math.sin(t), h]; } },
        };
        const which = v.select('$U=$', Object.entries(SETS).map(([value, s]) => ({ value, label: s.label })), 'two');
        const N = v.slider('pairs', 10, 150, 60, { int: true });
        let seed = 3;
        v.button('Resample', () => { seed += 1; });
        const S = v.stage({ x: [-2, 2], y: [-1.75, 1.75], equal: true, axes: false, height: 430 });
        const sc = scene3(v, S);
        v.legend([['green', '$u+w\\in U$', { dot: true }], ['teal', '$\\lambda u\\in U$', { dot: true }], ['red', 'outside $U$', { dot: true }], ['blue', 'highlighted $u$, $w$']]);
        let st = {};
        v.render(() => {
          const key = which.value, U = SETS[key], r = v.rng(seed * 101 + 7);
          sc.begin();
          // the set itself
          if (key === 'plane' || key === 'two') sc.disc(a0, b0, 1.45, { color: 'accent', fillAlpha: 0.12, grid: true });
          if (key === 'two') sc.disc(a2, b2, 1.45, { color: 'purple', fillAlpha: 0.12, grid: true });
          if (key === 'line') line3(sc, d0, 'accent', 1.75, { width: 5 });
          if (key === 'off') sc.disc(a0, b0, 1.25, { color: 'accent', fillAlpha: 0.12, grid: true }, scl3(n0, 0.55));
          if (key === 'cone') {
            for (let k = 0; k < 16; k++) { const t = (k * Math.PI) / 8; sc.line([-1.1 * Math.cos(t), -1.1 * Math.sin(t), -1.1], [1.1 * Math.cos(t), 1.1 * Math.sin(t), 1.1], { color: 'accent', width: 1, alpha: 0.4 }, 10); }
            for (const h of [-1.1, -0.55, 0.55, 1.1]) { const pts = []; for (let k = 0; k <= 48; k++) { const t = (k * Math.PI) / 24; pts.push([h * Math.cos(t), h * Math.sin(t), h]); } sc.path(pts, { color: 'accent', width: 1, alpha: 0.5 }); }
          }
          // random pairs, their sums and multiples
          let inS = 0, inM = 0, bad = null;
          const pairs = [];
          for (let i = 0; i < N.value; i++) {
            const u = U.sample(r), w = U.sample(r), lam = r.uniform(-1.6, 1.6), s = add3(u, w), m = scl3(u, lam);
            const okS = U.member(s), okM = U.member(m);
            if (okS) inS++; if (okM) inM++;
            if ((!okS || !okM)) { const score = len3(cross3(u, w)) + 0.3 * (len3(u) + len3(w)); if (!bad || score > bad.score) bad = { u, w, s, m, lam, okS, okM, score }; }
            pairs.push({ u, w, s, m, okS, okM });
          }
          for (const q of pairs) { sc.dot(q.s, { r: 3.2, color: q.okS ? 'green' : 'red', ring: false, top: false, bias: -0.02 }); sc.dot(q.m, { r: 2.4, color: q.okM ? 'teal' : 'red', ring: false, top: false, bias: -0.02 }); }
          const hl = bad || pairs[0];
          if (hl) {
            sc.line(hl.u, hl.s, { color: 'muted', width: 1, dash: [3, 4] }); sc.line(hl.w, hl.s, { color: 'muted', width: 1, dash: [3, 4] });
            sc.arrow([0, 0, 0], hl.u, { color: 'blue' }); sc.arrow([0, 0, 0], hl.w, { color: 'orange' });
            sc.arrow([0, 0, 0], hl.s, { color: hl.okS ? 'green' : 'red', width: 2.8 });
            if (bad && !bad.okM && bad.okS) sc.arrow([0, 0, 0], hl.m, { color: 'red', width: 2.4, dash: [5, 4] });
            sc.tex('u', hl.u, { color: 'blue', dx: 10, dy: -10, size: 14 }); sc.tex('w', hl.w, { color: 'orange', dx: 10, dy: -10, size: 14 });
            sc.tex(bad && !bad.okM && bad.okS ? '\\lambda u' : 'u+w', bad && !bad.okM && bad.okS ? hl.m : hl.s, { color: 'red', dx: 14, dy: -12, size: 14 });
          }
          const has0 = U.member([0, 0, 0]);
          sc.dot([0, 0, 0], { r: 5.5, color: has0 ? 'green' : 'red', bias: 0.5 });
          sc.flush();
          S.corner(has0 && inS === pairs.length && inM === pairs.length ? 'everything stays in U' : 'the operations lead out of U', 'tl', { color: has0 && inS === pairs.length && inM === pairs.length ? 'green' : 'red', weight: 600 });
          st = { key, has0, inS, inM, n: pairs.length, bad };
        });
        v.readout(() => {
          const { key, has0, inS, inM, n, bad } = st; if (!key) return '';
          const head = `$0\\in U$: ${has0 ? 'yes' : '**no**'}; sums in $U$: ${inS}/${n}; multiples in $U$: ${inM}/${n}. `;
          if (has0 && inS === n && inM === n) return head + 'With the operations of $\\R^3$ this set is a vector space in its own right — a **subspace**.';
          const why = { off: 'it misses $0$, and the sum of two of its points lies twice as far from $0$ in the normal direction', two: 'the sum of a vector from one plane and one from the other lands in neither plane', cone: 'it is closed under scaling (every $\\lambda u$ stays on the cone) but not under addition' }[key];
          return head + `**Not a subspace**: ${why}.` + (bad ? ` E.g. $u=${vtex(bad.u)}$, $w=${vtex(bad.w)}$ give $u+w=${vtex(bad.s)}$.` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 1.34
    {
      num: '1.34',
      kind: 'Theorem',
      name: 'Conditions for a subspace',
      statement: String.raw`A subset $U$ of a vector space $V$ is a subspace of $V$ if and only if it satisfies the following three conditions:
(a) **additive identity:** $0\in U$;
(b) **closed under addition:** $u,w\in U$ implies $u+w\in U$;
(c) **closed under scalar multiplication:** $a\in\mathbf F$ and $u\in U$ imply $au\in U$.`,
      idea: String.raw`A subspace certainly has these properties. Conversely, (b) and (c) make addition and scalar multiplication into operations *on* $U$, and (a) supplies the zero vector. Commutativity, associativity, the distributive laws and $1u=u$ hold in $U$ because they hold for all elements of $V$. The one remaining axiom is the additive inverse: for $u\in U$, the vector $(-1)u$ is in $U$ by (c), and it is $-u$ by Theorem 1.32.`,
      caption: String.raw`Choose a subset and drag $u$ and $w$ (they stay in it); the slider sets $\lambda$. Each of the four subsets of $\R^2$ fails in its own way — the shifted line misses $0$, the two axes are not closed under addition, the quadrant is not closed under negative multiples — while the line through $0$ passes. The last two options test polynomials: $\{p\in\mathcal P_2(\R): p(1)=0\}$ is a subspace, $\{p: p(1)=1\}$ is not (the zero polynomial is missing). The readout names the first failing condition and a counterexample.`,
      deps: ['ladr-1.33', 'ladr-1.32'],
      tags: ['subspaces'],
      viz(v) {
        const M = v.M, d = [2 / Math.sqrt(5), 1 / Math.sqrt(5)];
        const SETS = {
          line: { label: 'line $y=x/2$', member: (p) => Math.abs(p[1] - p[0] / 2) < 1e-9, proj: (x, y) => { const t = x * d[0] + y * d[1]; return [t * d[0], t * d[1]]; } },
          off: { label: 'line $y=x/2+0.8$', member: (p) => Math.abs(p[1] - p[0] / 2 - 0.8) < 1e-9, proj: (x, y) => { const t = x * d[0] + (y - 0.8) * d[1]; return [t * d[0], t * d[1] + 0.8]; } },
          axes: { label: 'both axes', member: (p) => Math.abs(p[0]) < 1e-9 || Math.abs(p[1]) < 1e-9, proj: (x, y) => (Math.abs(x) < Math.abs(y) ? [0, y] : [x, 0]) },
          quad: { label: 'quadrant $x,y\\ge0$', member: (p) => p[0] >= -1e-12 && p[1] >= -1e-12, proj: (x, y) => [Math.max(0, x), Math.max(0, y)] },
          p0: { label: '$p(1)=0$ in $\\mathcal P_2(\\R)$', poly: true, c: 0 },
          p1: { label: '$p(1)=1$ in $\\mathcal P_2(\\R)$', poly: true, c: 1 },
        };
        const which = v.select('$U=$', Object.entries(SETS).map(([value, s]) => ({ value, label: s.label })), 'quad', { onChange: () => relayout() });
        const sl = v.slider('$\\lambda$', -2, 2, -0.8, { step: 0.05 });
        const PL = v.stage({ x: [-2.6, 2.6], y: [-2, 2], equal: true, height: 380, ticks: false });
        const G = v.stage({ x: [-2, 2], y: [-3, 3.2], height: 380, xlabel: 'x' });
        const relayout = () => layout(v, [[PL, !SETS[which.value].poly], [G, !!SETS[which.value].poly]]);
        relayout();
        const cur = () => SETS[which.value];
        const U = PL.handle(1.2, 0.6, { color: 'blue', label: 'u', constrain: (x, y) => cur().proj ? cur().proj(x, y) : [x, y] });
        const W = PL.handle(0.4, 1.2, { color: 'orange', label: 'w', constrain: (x, y) => cur().proj ? cur().proj(x, y) : [x, y] });
        const vert = (x0) => (x, y) => [x0, M.clamp(y, -1.8, 1.8)];
        const pu = [G.handle(-1, 1.2, { color: 'blue', constrain: vert(-1) }), G.handle(0, -0.5, { color: 'blue', constrain: vert(0) })];
        const pw = [G.handle(-1, -0.7, { color: 'orange', constrain: vert(-1) }), G.handle(0, 0.9, { color: 'orange', constrain: vert(0) })];
        let lastKey = null, st = {};
        // polynomial with p(−1) = y0, p(0) = y1, p(1) = y2 (Lagrange form)
        const quad = (p) => (x) => (p[0] * x * (x - 1)) / 2 + p[1] * (1 - x * x) + (p[2] * x * (x + 1)) / 2;
        const sampler = (K, r) => {
          if (K.poly) return [r.uniform(-1.5, 1.5), r.uniform(-1.5, 1.5), K.c];
          if (K === SETS.quad) return [r.uniform(0, 2), r.uniform(0, 2)];
          if (K === SETS.axes) return r() < 0.5 ? [r.uniform(-2, 2), 0] : [0, r.uniform(-2, 2)];
          return K.proj(r.uniform(-2, 2), r.uniform(-2, 2));
        };
        v.render(() => {
          const key = which.value, K = SETS[key], lam = sl.value;
          U.visible = W.visible = !K.poly; for (const h of [...pu, ...pw]) h.visible = !!K.poly;
          if (key !== lastKey && !K.poly) { lastKey = key; const a = K.proj(U.x, U.y), b = K.proj(W.x, W.y); U.x = a[0]; U.y = a[1]; W.x = b[0]; W.y = b[1]; if (key === 'axes') { U.x = 1.2; U.y = 0; W.x = 0; W.y = 1.1; } }
          if (key !== lastKey) lastKey = key;
          const memb = (p) => (K.poly ? Math.abs(p[2] - K.c) < 1e-9 : K.member(p));
          const add = (p, q) => p.map((c, i) => c + q[i]), scal = (a, p) => p.map((c) => a * c);
          const u = K.poly ? [pu[0].y, pu[1].y, K.c] : [U.x, U.y], w = K.poly ? [pw[0].y, pw[1].y, K.c] : [W.x, W.y];
          const zero = u.map(() => 0), s = add(u, w), m = scal(lam, u);
          const c1 = memb(zero), c2 = memb(s), c3 = memb(m);
          // search for counterexamples beyond the current choice
          const r = v.rng(17); let ex2 = c2 ? null : { u, w, s }, ex3 = c3 ? null : { u, a: lam, m };
          for (let i = 0; i < 400 && (!ex2 || !ex3); i++) {
            const x = sampler(K, r), y = sampler(K, r), a = r.uniform(-3, 3);
            if (!ex2 && !memb(add(x, y))) ex2 = { u: x, w: y, s: add(x, y) };
            if (!ex3 && !memb(scal(a, x))) ex3 = { u: x, a, m: scal(a, x) };
          }
          if (!K.poly) {
            // the set
            if (key === 'line' || key === 'off') { const b = key === 'off' ? 0.8 : 0; PL.line(-4, -2 + b, 4, 2 + b, { color: 'accent', width: 6, alpha: 0.25 }); }
            if (key === 'axes') { PL.line(-4, 0, 4, 0, { color: 'accent', width: 6, alpha: 0.25 }); PL.line(0, -4, 0, 4, { color: 'accent', width: 6, alpha: 0.25 }); }
            if (key === 'quad') PL.rect(0, 0, 9, 9, { fill: 'accent', fillAlpha: 0.12, stroke: false });
            PL.line(u[0], u[1], s[0], s[1], { color: 'muted', width: 1, dash: [3, 4] }); PL.line(w[0], w[1], s[0], s[1], { color: 'muted', width: 1, dash: [3, 4] });
            arrow2(PL, [0, 0], u, 'blue'); arrow2(PL, [0, 0], w, 'orange');
            arrow2(PL, [0, 0], s, c2 ? 'green' : 'red', 'u+w', { width: 2.8 });
            arrow2(PL, [0, 0], m, c3 ? 'purple' : 'red', '\\lambda u', { width: 2.4, dash: c3 ? null : [6, 4] });
            PL.dot(0, 0, c1 ? { r: 5.5, color: 'green' } : { r: 6, color: 'red', hollow: true, width: 2.4 });
            PL.tex('0', 0, 0, { dx: -10, dy: 13, size: 13, color: c1 ? 'green' : 'red' });
          } else {
            G.line(1, -3, 1, 3.2, { color: 'faint', width: 1, dash: [3, 4] });
            G.line(-2, 0, 2, 0, { color: c1 ? 'green' : 'red', width: 3, alpha: 0.35 });
            G.tex(c1 ? '0\\in U' : '0\\notin U', -1.95, 0, { color: c1 ? 'green' : 'red', align: 'left', dy: 13, size: 13 });
            G.fn(quad(m), { color: c3 ? 'purple' : 'red', width: 2, dash: [6, 4] });
            G.fn(quad(u), { color: 'blue', width: 2.4 }); G.fn(quad(w), { color: 'orange', width: 2.4 });
            G.fn(quad(s), { color: c2 ? 'green' : 'red', width: 3 });
            G.dot(1, K.c, { r: 7, color: 'ink', hollow: true, width: 2 });
            G.tex(`p(1)=${K.c}`, 1, K.c, { align: 'left', dx: 12, dy: -12, size: 13, color: 'ink' });
            G.dot(1, s[2], { r: 4, color: c2 ? 'green' : 'red' }); G.dot(1, m[2], { r: 4, color: c3 ? 'purple' : 'red' });
            v.legend([['blue', '$u$'], ['orange', '$w$'], ['green', '$u+w$ (red if outside $U$)'], ['purple', '$\\lambda u$', { dash: true }]]);
          }
          if (!K.poly) v.legend([['blue', '$u\\in U$'], ['orange', '$w\\in U$'], ['green', '$u+w$'], ['purple', '$\\lambda u$'], ['red', 'outside $U$', { dash: true }]]);
          const first = !c1 ? 1 : ex2 ? 2 : ex3 ? 3 : 0;
          (K.poly ? G : PL).corner(first ? `fails condition (${'abc'[first - 1]})` : 'U is a subspace', 'tl', { color: first ? 'red' : 'green', weight: 600 });
          st = { K, c1, ex2, ex3, first, lam };
        });
        v.readout(() => {
          const { K, c1, ex2, ex3, first } = st; if (!K) return '';
          const show2 = (p) => (K.poly ? `p(1)=${tn(p[2])}` : vtex(p));
          const ok = '✓', no = '✗';
          const lines = [
            `(a) $0\\in U$ ${c1 ? ok : no + (K.poly ? ' (the zero polynomial has $p(1)=0\\ne1$)' : ' (the origin is not in the set)')}`,
            `(b) closed under addition ${ex2 ? `${no} (e.g. $u=${show2(ex2.u)}$, $w=${show2(ex2.w)}$ but $u+w$ has $${show2(ex2.s)}$)` : `${ok} (your $u+w$ and 400 random pairs)`}`,
            `(c) closed under scalar multiplication ${ex3 ? `${no} (e.g. $${tn(ex3.a)}\\cdot${show2(ex3.u)}$ gives $${show2(ex3.m)}$)` : `${ok} (your $\\lambda u$ and 400 random tries)`}`,
          ];
          return lines.join('; ') + '. ' + (first ? `So $U$ is **not** a subspace; the first failing condition is (${'abc'[first - 1]}).` : 'All three hold, so $U$ is a subspace; in particular $-u=(-1)u\\in U$ by (c) and Theorem 1.32.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.36
    {
      num: '1.36',
      kind: 'Definition',
      name: 'Sum of subspaces',
      statement: String.raw`Let $V_1,\dots,V_m$ be subspaces of $V$. Their *sum* is the set of all vectors obtained by adding one element from each:
$$V_1+\dots+V_m=\{v_1+\dots+v_m : v_1\in V_1,\dots,v_m\in V_m\}.$$`,
      idea: String.raw`The sum is not the union: the union of two lines through $0$ is a cross, while their sum is the whole plane they span, because adding a vector of one line to a vector of the other reaches every point of that plane. Each $V_k$ sits inside the sum (take the other pieces equal to $0$), and Theorem 1.40 shows the sum is the smallest subspace with that property.`,
      caption: String.raw`Drag $u$ and $w$ to tilt the subspaces $U=\operatorname{span}(u)$ and $W$ (drag the background to rotate). Gold dots are random sums $u'+w'$ with $u'\in U$, $w'\in W$; press play to watch them accumulate. Two different lines fill a plane (shaded green); a line not contained in a plane and that plane span all of $\R^3$ (the random sums show a finite region of that span). Drag $w$ onto $U$ (it snaps) and the sums collapse back into $U$.`,
      deps: ['ladr-1.33'],
      tags: ['subspaces'],
      viz(v) {
        const M = v.M, n0 = unit([0.3, -0.35, 1]), [a0, b0] = planeBasis(n0);
        const sp = v.select('', [{ value: 'LL', label: 'two lines $U$, $W$' }, { value: 'LP', label: 'plane $U$, line $W$' }], 'LL');
        const S = v.stage({ x: [-2, 2], y: [-1.75, 1.75], equal: true, axes: false, height: 430 });
        const sc = scene3(v, S);
        const SNAP = Math.cos((4 * Math.PI) / 180);
        const U1 = sc.handle([1.15, 0.15, 0.25], { color: 'blue', label: 'u' });
        const U2 = sc.handle(add3(scl3(a0, 0.95), scl3(b0, 0.35)), { color: 'blue', label: 'u', mode: 'plane', a: a0, b: b0 });
        const Wh = sc.handle([0.1, 0.95, 0.6], {
          color: 'orange', label: 'w',
          snap: (p) => {
            if (sp.value === 'LL') { const e = unit(U1.p); return Math.abs(dot3(unit(p), e)) > SNAP ? scl3(e, dot3(p, e)) : p; }
            return Math.abs(dot3(unit(p), n0)) < Math.sin((4 * Math.PI) / 180) ? sub3(p, scl3(n0, dot3(p, n0))) : p;
          },
        });
        const r0 = v.rng(11), COEF = Array.from({ length: 360 }, () => [r0.uniform(-1, 1), r0.uniform(-1, 1), r0.uniform(-1, 1)]);
        let st = {};
        v.legend([['blue', '$U$'], ['orange', '$W$'], ['gold', 'sums $u\'+w\'$', { dot: true }], ['green', '$u+w$ and the plane $U+W$']]);
        v.animate((t) => {
          const m = sp.value, k = Math.min(COEF.length, Math.floor(t * 80) + 12);
          U1.h.visible = m === 'LL'; U2.h.visible = m === 'LP';
          const u = m === 'LL' ? U1.p : U2.p, w = Wh.p, ue = unit(u), we = unit(w);
          const L = 1.15;
          sc.begin();
          let kind;
          if (m === 'LL') {
            const nn = cross3(ue, we), deg = len3(nn) < 1e-9;
            kind = deg ? 'line' : 'plane';
            if (!deg) { const nu = unit(nn), [pa, pb] = [ue, cross3(nu, ue)]; sc.disc(pa, pb, 1.6, { color: 'green', fillAlpha: 0.1, alpha: 0.4 }); }
            line3(sc, ue, 'blue', 1.75); line3(sc, we, 'orange', 1.75);
          } else {
            const deg = Math.abs(dot3(we, n0)) < 1e-9;
            kind = deg ? 'plane' : 'space';
            sc.disc(a0, b0, 1.45, { color: 'blue', fillAlpha: 0.12, grid: true });
            line3(sc, we, 'orange', 1.75);
          }
          // sprinkle the sums
          let maxOff = 0; const nrm = m === 'LL' && kind === 'plane' ? unit(cross3(ue, we)) : null;
          for (let i = 0; i < k; i++) {
            const c = COEF[i];
            const s = m === 'LL' ? add3(scl3(ue, c[0] * L), scl3(we, c[1] * L)) : add3(add3(scl3(a0, c[0]), scl3(b0, c[1])), scl3(we, c[2] * L));
            if (nrm) maxOff = Math.max(maxOff, Math.abs(dot3(s, nrm)));
            sc.dot(s, { r: 2.6, color: 'gold', ring: false, top: false, bias: -0.03 });
          }
          const s = add3(u, w);
          sc.line(u, s, { color: 'muted', width: 1, dash: [3, 4] }); sc.line(w, s, { color: 'muted', width: 1, dash: [3, 4] });
          sc.arrow([0, 0, 0], u, { color: 'blue' }); sc.arrow([0, 0, 0], w, { color: 'orange' });
          sc.arrow([0, 0, 0], s, { color: 'green', width: 3 }); sc.tex('u+w', s, { color: 'green', align: 'left', dx: 8, dy: -12, size: 14 });
          sc.dot([0, 0, 0], { r: 3.5, color: 'ink' });
          sc.flush();
          S.corner({ line: 'U + W = U: a line', plane: 'U + W is a plane', space: 'U + W = ℝ³' }[kind], 'tl', { color: 'green', weight: 600 });
          st = { m, kind, k, maxOff, u, w };
        }, { period: 6, still: 3.5 });
        v.readout(() => {
          const { m, kind, k, maxOff, w } = st; if (!m) return '';
          if (kind === 'line') return `$W=U$ here, so every sum $u'+w'$ stays on the line: $U+W=U$. The sum of two subspaces can be as small as the larger of them.`;
          if (m === 'LL') return `The ${k} sums drawn all lie in the plane through $0$ containing $U$ and $W$ (largest distance from it: $${v.sci(maxOff, 2)}$) and spread over it: $U+W$ is that plane — not the cross $U\\cup W$. It contains $U$ (take $w'=0$) and $W$ (take $u'=0$).`;
          if (kind === 'plane') return `$w$ lies in $U$, so $W\\subseteq U$ and $U+W=U$: the sums never leave the plane.`;
          return `The line $W$ leaves the plane $U$ (angle $${tn(lineplaneDeg(w, n0), 1)}^\\circ$), so the sums fill out space: every $x\\in\\R^3$ is $u'+w'$ — slide along $W$ from $x$ until you hit $U$. Thus $U+W=\\R^3$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.40
    {
      num: '1.40',
      kind: 'Theorem',
      name: 'Sum of subspaces is the smallest containing subspace',
      statement: String.raw`If $V_1,\dots,V_m$ are subspaces of $V$, then $V_1+\dots+V_m$ is a subspace of $V$, it contains each $V_k$, and it is contained in every subspace of $V$ that contains all of $V_1,\dots,V_m$. In short, $V_1+\dots+V_m$ is the smallest subspace of $V$ containing $V_1,\dots,V_m$.`,
      idea: String.raw`The sum contains $0=0+\dots+0$, and sums and scalar multiples of sums $v_1+\dots+v_m$ are again of that form (regroup, using the closure of each $V_k$), so it is a subspace by Theorem 1.34. Each $V_k$ is inside it (set the other pieces to $0$). Conversely, a subspace containing every $V_k$ contains each $v_k$ and is closed under addition, so it contains every $v_1+\dots+v_m$.`,
      caption: String.raw`$U$ and $W$ are the blue and orange lines (drag $u$, $w$); their sum is the green plane. The purple plane $X$ is spanned by $x_1,x_2$ — drag them (they snap onto $U$ and $W$). The dots are sums $u'+w'$: green when they lie in $X$, red when not. While $X$ misses $U$ or $W$ some sums escape; as soon as $X$ contains both lines, every sum lies in $X$ — and $X$ is forced to be $U+W$. Switch to $X=\R^3$ for the other subspace that contains both.`,
      deps: ['ladr-1.36', 'ladr-1.34'],
      tags: ['subspaces'],
      viz(v) {
        const sp = v.select('', [{ value: 'plane', label: '$X$ = a plane through $0$' }, { value: 'all', label: '$X=\\R^3$' }], 'plane');
        const S = v.stage({ x: [-2, 2], y: [-1.75, 1.75], equal: true, axes: false, height: 430 });
        const sc = scene3(v, S);
        const Uh = sc.handle([1.15, 0.1, 0.3], { color: 'blue', label: 'u' }), Wh = sc.handle([0.1, 1.0, 0.5], { color: 'orange', label: 'w' });
        const SNAP = Math.cos((6 * Math.PI) / 180);
        const snapTo = (p) => { for (const d of [unit(Uh.p), unit(Wh.p)]) if (Math.abs(dot3(unit(p), d)) > SNAP) return scl3(d, dot3(p, d)); return p; };
        const X1 = sc.handle(scl3(unit([1.15, 0.1, 0.3]), 1.2), { color: 'purple', label: 'x₁', snap: snapTo });
        const X2 = sc.handle([-0.45, 0.35, 1.05], { color: 'purple', label: 'x₂', snap: snapTo });
        const r0 = v.rng(5), COEF = Array.from({ length: 40 }, () => [r0.uniform(-1.1, 1.1), r0.uniform(-1.1, 1.1)]);
        v.legend([['blue', '$U$'], ['orange', '$W$'], ['green', '$U+W$; sums in $X$', { area: true }], ['purple', '$X$', { area: true }], ['red', 'sums outside $X$', { dot: true }]]);
        let st = {};
        v.render(() => {
          const all = sp.value === 'all';
          X1.h.visible = X2.h.visible = !all;
          sc.begin();
          const ue = unit(Uh.p), we = unit(Wh.p), nUW = cross3(ue, we), same = len3(nUW) < 1e-6;
          // keep x₁, x₂ glued to U or W while those move
          for (const X of [X1, X2]) for (const d of [ue, we]) if (len3(cross3(unit(X.p), d)) < 1e-6) X.p = scl3(d, dot3(X.p, d));
          const nXr = cross3(X1.p, X2.p), degX = len3(nXr) < 1e-6, nX = unit(nXr);
          const inX = (p) => all || (!degX && Math.abs(dot3(p, nX)) < 1e-6 * (1 + len3(p)));
          const cU = inX(ue), cW = inX(we);
          if (!same) { const nu = unit(nUW); sc.disc(ue, cross3(nu, ue), 1.55, { color: 'green', fillAlpha: 0.09, alpha: 0.35 }); }
          if (!all && !degX) { const [xa, xb] = [unit(X1.p), unit(cross3(nX, unit(X1.p)))]; sc.disc(xa, xb, 1.4, { color: 'purple', fillAlpha: 0.13, grid: true }); }
          line3(sc, ue, 'blue', 1.75, { width: cU ? 5 : 3.5, alpha: cU ? 0.65 : 0.4 }); line3(sc, we, 'orange', 1.75, { width: cW ? 5 : 3.5, alpha: cW ? 0.65 : 0.4 });
          let nin = 0;
          for (const c of COEF) {
            const s = add3(scl3(ue, c[0]), scl3(we, c[1])), ok = inX(s);
            if (ok) nin++;
            sc.dot(s, { r: 3.4, color: ok ? 'green' : 'red', ring: false, bias: -0.03 });
          }
          sc.arrow([0, 0, 0], Uh.p, { color: 'blue' }); sc.arrow([0, 0, 0], Wh.p, { color: 'orange' });
          if (!all) { sc.arrow([0, 0, 0], X1.p, { color: 'purple', width: 2 }); sc.arrow([0, 0, 0], X2.p, { color: 'purple', width: 2 }); }
          sc.dot([0, 0, 0], { r: 3.5, color: 'ink' });
          sc.flush();
          const both = cU && cW;
          S.corner(both ? `X ⊇ U and X ⊇ W  ⇒  X ⊇ U + W (${nin}/${COEF.length} sums in X)` : `X ⊉ ${!cU && !cW ? 'U, W' : !cU ? 'U' : 'W'}: ${COEF.length - nin} sums escape X`, 'tl', { color: both ? 'green' : 'red', weight: 600 });
          st = { all, cU, cW, nin, n: COEF.length, degX, same, angU: degX ? 90 : lineplaneDeg(ue, nX), angW: degX ? 90 : lineplaneDeg(we, nX) };
        });
        v.readout(() => {
          const { all, cU, cW, nin, n, degX, same, angU, angW } = st; if (all === undefined) return '';
          if (same) return 'Here $W=U$, so $U+W=U$ is a line; any $X$ containing that line contains all the sums.';
          if (all) return `$X=\\R^3$ contains $U$ and $W$, hence all ${n} sums: $U+W\\subseteq X$, strictly. The only subspaces of $\\R^3$ containing two different lines are their plane $U+W$ and $\\R^3$ itself.`;
          if (degX) return '$x_1$ and $x_2$ lie on one line, so they do not span a plane; pull them apart.';
          const a = `angle of $U$ with $X$: $${tn(angU, 1)}^\\circ$, of $W$ with $X$: $${tn(angW, 1)}^\\circ$. `;
          if (cU && cW) return a + `$X$ contains $U$ and $W$, so — as the theorem promises — it contains every sum: ${nin}/${n} lie in $X$. In fact $X=U+W$: the smallest such subspace.`;
          return a + `$X$ does not contain ${!cU && !cW ? 'either line' : !cU ? '$U$' : '$W$'}, so the theorem says nothing, and indeed ${n - nin} of the ${n} sums lie outside $X$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.41
    {
      num: '1.41',
      kind: 'Definition',
      name: 'Direct sum',
      statement: String.raw`Let $V_1,\dots,V_m$ be subspaces of $V$. The sum $V_1+\dots+V_m$ is a *direct sum* if each of its elements can be written in **only one way** as $v_1+\dots+v_m$ with each $v_k\in V_k$. A direct sum is written $V_1\oplus\dots\oplus V_m$.`,
      idea: String.raw`In a direct sum every vector has well-defined *components* $v_k\in V_k$, just as a point of $\R^3$ has well-defined coordinates along three independent axes. In $\R^3$, a plane and a line not lying in it give a direct sum; so do two different lines. Two planes do not: they share a line, and anything in the shared line can be moved freely from one component to the other.`,
      caption: String.raw`Drag the target $v$ (gold) and rotate the view. For a plane and a line, or for two lines (then $v$ is kept in their plane), there is exactly one parallelogram $v=u+w$. For two planes there is a whole line of decompositions: the slider $\tau$ moves along them, the dashed lines are all the possible $u$'s and $w$'s, and they differ by vectors of the red intersection $U\cap W$.`,
      deps: ['ladr-1.36'],
      tags: ['direct sums'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Direct_sum_of_modules' },
      viz(v) {
        const M = v.M;
        const nU = unit([0.2, -0.3, 1]), [aU, bU] = planeBasis(nU), dW = unit([-0.45, 0.4, 0.8]);
        const l1 = unit([1, 0.15, 0.1]), l2 = unit([0.25, 1, 0.25]), nL = unit(cross3(l1, l2)), [aL, bL] = planeBasis(nL);
        const nW = unit([1, 0.3, 0.35]), [aW, bW] = planeBasis(nW);
        const sp = v.select('', [{ value: 'PL', label: 'plane $U$ + line $W$' }, { value: 'LL', label: 'two lines' }, { value: 'PP', label: 'two planes' }], 'PL');
        const tau = v.slider('$\\tau$', -1.2, 1.2, 0.45, { step: 0.01 });
        const S = v.stage({ x: [-2, 2], y: [-1.75, 1.75], equal: true, axes: false, height: 430 });
        const sc = scene3(v, S);
        const Vf = sc.handle([0.7, 0.45, 0.85], { color: 'gold', label: 'v' });
        const Vl = sc.handle(add3(scl3(l1, 0.9), scl3(l2, 0.75)), { color: 'gold', label: 'v', mode: 'plane', a: aL, b: bL });
        const solve3 = (c1, c2, c3, x) => M.solve([[c1[0], c2[0], c3[0]], [c1[1], c2[1], c3[1]], [c1[2], c2[2], c3[2]]], x);
        let st = {};
        v.legend([['blue', '$U$ and $u$'], ['orange', '$W$ and $w$'], ['gold', 'the target $v$'], ['red', '$U\\cap W$']]);
        v.render(() => {
          const m = sp.value;
          Vf.h.visible = m !== 'LL'; Vl.h.visible = m === 'LL'; tau.el.hidden = m !== 'PP';
          const x = m === 'LL' ? Vl.p : Vf.p;
          sc.begin();
          let u, w, fam = null;
          if (m === 'PL') {
            sc.disc(aU, bU, 1.45, { color: 'blue', fillAlpha: 0.11, grid: true }); line3(sc, dW, 'orange', 1.75);
            const c = solve3(aU, bU, dW, x); w = scl3(dW, c[2]); u = sub3(x, w);
          } else if (m === 'LL') {
            sc.disc(aL, bL, 1.55, { color: 'green', fillAlpha: 0.07, alpha: 0.3 });
            line3(sc, l1, 'blue', 1.75); line3(sc, l2, 'orange', 1.75);
            const g = [[dot3(l1, l1), dot3(l1, l2)], [dot3(l1, l2), dot3(l2, l2)]], c = M.solve(g, [dot3(l1, x), dot3(l2, x)]);
            u = scl3(l1, c[0]); w = scl3(l2, c[1]);
          } else {
            sc.disc(aU, bU, 1.45, { color: 'blue', fillAlpha: 0.11 }); sc.disc(aW, bW, 1.45, { color: 'orange', fillAlpha: 0.11 });
            const k = unit(cross3(nU, nW)), e1 = unit(cross3(nU, k)), e2 = unit(cross3(nW, k));
            line3(sc, k, 'red', 1.75, { width: 4, alpha: 0.7 });
            const c = solve3(k, e1, e2, x), t = tau.value;
            u = add3(scl3(e1, c[1]), scl3(k, c[0] / 2 - t)); w = add3(scl3(e2, c[2]), scl3(k, c[0] / 2 + t));
            const u0 = scl3(e1, c[1]), w0 = scl3(e2, c[2]);
            sc.line(add3(u0, scl3(k, -2.2)), add3(u0, scl3(k, 2.2)), { color: 'blue', width: 1.4, dash: [5, 4] });
            sc.line(add3(w0, scl3(k, -2.2)), add3(w0, scl3(k, 2.2)), { color: 'orange', width: 1.4, dash: [5, 4] });
            for (const tt of [-1, -0.5, 0.5, 1]) { const uu = add3(u0, scl3(k, c[0] / 2 - tt)), ww = add3(w0, scl3(k, c[0] / 2 + tt)); sc.line(uu, x, { color: 'blue', width: 1, alpha: 0.25 }); sc.line(ww, x, { color: 'orange', width: 1, alpha: 0.25 }); sc.dot(uu, { r: 2.5, color: 'blue', alpha: 0.5, ring: false }); sc.dot(ww, { r: 2.5, color: 'orange', alpha: 0.5, ring: false }); }
            fam = { k };
          }
          sc.line(u, x, { color: 'muted', width: 1.2, dash: [4, 4] }); sc.line(w, x, { color: 'muted', width: 1.2, dash: [4, 4] });
          sc.arrow([0, 0, 0], u, { color: 'blue', width: 3 }); sc.arrow([0, 0, 0], w, { color: 'orange', width: 3 });
          sc.arrow([0, 0, 0], x, { color: 'gold', width: 2, alpha: 0.8 });
          sc.tex('u', u, { color: 'blue', dx: 10, dy: 12, size: 14 }); sc.tex('w', w, { color: 'orange', dx: 10, dy: -12, size: 14 });
          sc.dot([0, 0, 0], { r: 3.5, color: 'ink' });
          sc.flush();
          S.corner(fam ? 'infinitely many decompositions — not direct' : 'exactly one decomposition — direct', 'tl', { color: fam ? 'red' : 'green', weight: 600 });
          st = { m, u, w, x, fam };
        });
        v.readout(() => {
          const { m, u, w, x, fam } = st; if (!m) return '';
          const body = `$v = ${vtex(x)} = u + w$ with $u = ${vtex(u)}\\in U$, $w = ${vtex(w)}\\in W$`;
          if (!fam) return body + `, and no other choice works: ${m === 'PL' ? 'the line through $v$ parallel to $W$ meets the plane $U$ in exactly one point' : 'within their plane the two lines act as skew coordinate axes'}. So $U+W$ is a direct sum, $U\\oplus W$${m === 'PL' ? ' $=\\R^3$' : ''}.`;
          return body + ` — but so does $u - \\tau k$, $w + \\tau k$ for every $\\tau$ and every $k$ in the line $U\\cap W$. Uniqueness fails, so $U+W$ is **not** a direct sum.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.45
    {
      num: '1.45',
      kind: 'Theorem',
      name: 'Condition for a direct sum',
      statement: String.raw`Let $V_1,\dots,V_m$ be subspaces of $V$. Then $V_1+\dots+V_m$ is a direct sum if and only if the only way to write $0$ as $v_1+\dots+v_m$ with each $v_k\in V_k$ is to take every $v_k=0$.`,
      idea: String.raw`If the sum is direct, $0=0+\dots+0$ is the unique decomposition of $0$. Conversely, if $v=u_1+\dots+u_m=w_1+\dots+w_m$ are two decompositions, subtracting gives $0=(u_1-w_1)+\dots+(u_m-w_m)$ with $u_k-w_k\in V_k$, so the hypothesis forces $u_k=w_k$ for every $k$. Uniqueness for *every* vector is thus reduced to uniqueness for the single vector $0$.`,
      caption: String.raw`Three lines $V_1,V_2,V_3$ through $0$; drag $v_k$ along $V_k$. The path $0\to v_1\to v_1+v_2\to v_1+v_2+v_3$ closes into a triangle exactly when $v_1+v_2+v_3=0$. Press *solve* to search for a nonzero solution. With $V_3$ tilted out of the plane of $V_1,V_2$ there is none — the sum is direct. Slide the tilt to $0^\circ$: the lines still meet pairwise only in $0$, yet a closed triangle appears and the sum is not direct.`,
      deps: ['ladr-1.41'],
      tags: ['direct sums'],
      viz(v) {
        const M = v.M;
        const nB = unit([0.15, -0.25, 1]), [ea, eb] = planeBasis(nB);
        const dirIn = (deg) => { const t = (deg * Math.PI) / 180; return add3(scl3(ea, Math.cos(t)), scl3(eb, Math.sin(t))); };
        const d1 = dirIn(-15), d2 = dirIn(70), e3 = dirIn(150);
        const tilt = v.slider('tilt of $V_3$', 0, 60, 30, { step: 0.5, fmt: (x) => `${x.toFixed(1)}°` });
        const d3of = () => { const t = (tilt.value * Math.PI) / 180; return add3(scl3(e3, Math.cos(t)), scl3(nB, Math.sin(t))); };
        const S = v.stage({ x: [-2, 2], y: [-1.75, 1.75], equal: true, axes: false, height: 430 });
        const sc = scene3(v, S);
        const H = [sc.handle(scl3(d1, 0.9), { color: 'blue', label: 'v₁', mode: 'line', d: d1 }), sc.handle(scl3(d2, 0.7), { color: 'orange', label: 'v₂', mode: 'line', d: d2 }), sc.handle(scl3(d3of(), 0.8), { color: 'purple', label: 'v₃', mode: 'line', d: d3of() })];
        let msg = '';
        v.button('solve $0=v_1+v_2+v_3$', () => {
          const d3 = d3of(), A = [0, 1, 2].map((i) => [d1[i], d2[i], d3[i]]), ns = M.nullspace(A);
          if (ns.length) { const c = ns[0], s = 1.1 / Math.max(...c.map(Math.abs)); H.forEach((h, i) => { h.t = c[i] * s; }); msg = 'found'; }
          else { H.forEach((h) => { h.t = 0; }); msg = 'trivial'; }
        });
        v.button('reset', () => { H[0].t = 0.9; H[1].t = 0.7; H[2].t = 0.8; msg = ''; });
        v.legend([['blue', '$V_1$'], ['orange', '$V_2$'], ['purple', '$V_3$'], ['gold', '$0\\to v_1\\to v_1+v_2\\to v_1+v_2+v_3$'], ['red', 'gap back to $0$', { dash: true }]]);
        let st = {}, lastTilt = null;
        v.render(() => {
          const d3 = d3of(); H[2].d = d3;
          if (lastTilt !== null && lastTilt !== tilt.value) msg = '';
          lastTilt = tilt.value;
          sc.begin();
          const flat = tilt.value === 0;
          sc.disc(ea, eb, 1.5, { color: 'muted', fillAlpha: 0.06, alpha: 0.25 });
          line3(sc, d1, 'blue', 1.75); line3(sc, d2, 'orange', 1.75); line3(sc, d3, 'purple', 1.75);
          const [p1, p2, p3] = H.map((h) => h.d.map((c) => c * h.t));
          const a = p1, b = add3(p1, p2), c = add3(b, p3), gap = len3(c), allZero = H.every((h) => Math.abs(h.t) < 1e-9);
          const closed = gap < 1e-6 && !allZero;
          if (closed) sc.poly([[0, 0, 0], a, b], { color: 'red', fillAlpha: 0.15, alpha: 0.5, top: true });
          sc.arrow([0, 0, 0], a, { color: 'blue', width: 3 }); sc.arrow(a, b, { color: 'orange', width: 3 }); sc.arrow(b, c, { color: 'purple', width: 3 });
          sc.path([[0, 0, 0], a, b, c], { color: 'gold', width: 8, alpha: 0.25, top: true });
          if (gap > 1e-6) sc.arrow(c, [0, 0, 0], { color: 'red', width: 1.8, dash: [5, 4], head: 8 });
          sc.dot([0, 0, 0], { r: 4.5, color: 'ink' });
          sc.flush();
          S.corner(closed ? '0 = v₁ + v₂ + v₃ with nonzero pieces: NOT direct' : msg === 'trivial' ? 'only 0 = 0 + 0 + 0: the sum is direct' : `|v₁ + v₂ + v₃| = ${v.fmt(gap, 3)}`, 'tl', { color: closed ? 'red' : msg === 'trivial' ? 'green' : 'muted', weight: 600 });
          const det = dot3(d1, cross3(d2, d3));
          st = { closed, gap, det, flat, msg, pair: [linelineDeg(d1, d2), linelineDeg(d1, d3), linelineDeg(d2, d3)] };
        });
        v.readout(() => {
          const { closed, det, flat, msg, pair } = st; if (!pair) return '';
          const pw = `Pairwise angles $${pair.map((x) => tn(x, 1) + '^\\circ').join(',\\ ')}$, so $V_i\\cap V_j=\\{0\\}$ for $i\\ne j$; $\\det[d_1\\ d_2\\ d_3] = ${tn(det, 3)}$. `;
          if (closed) return pw + `Here $0=v_1+v_2+v_3$ with nonzero $v_k$: the sum is **not** direct — the three lines lie in one plane, and pairwise trivial intersections are not enough when $m\\ge3$.`;
          if (flat) return pw + 'The three lines are coplanar: press *solve* to exhibit a nonzero way of writing $0$.';
          return pw + (msg === 'trivial' ? 'The solver finds only $v_1=v_2=v_3=0$. ' : '') + 'With $V_3$ out of the plane the triangle can never close unless all three pieces are $0$, so $V_1\\oplus V_2\\oplus V_3$ is direct (it is all of $\\R^3$).';
        });
      },
    },
    // ------------------------------------------------------------------ 1.46
    {
      num: '1.46',
      kind: 'Theorem',
      name: 'Direct sum of two subspaces',
      statement: String.raw`Let $U$ and $W$ be subspaces of $V$. Then $U+W$ is a direct sum if and only if $U\cap W=\{0\}$.`,
      idea: String.raw`If the sum is direct and $v\in U\cap W$, then $0=v+(-v)$ with $v\in U$ and $-v\in W$; by Theorem 1.45 this forces $v=0$. Conversely, if $U\cap W=\{0\}$ and $0=u+w$ with $u\in U$, $w\in W$, then $u=-w$ lies in both subspaces, hence $u=w=0$, and Theorem 1.45 gives directness. For three or more subspaces pairwise intersections are not enough — see Theorem 1.45.`,
      caption: String.raw`$U$ is the blue plane; tilt the line $W$ with the sliders and drag the target $v$. While $W$ leaves $U$, $U\cap W=\{0\}$ and $v$ splits into a unique $u+w$. As the tilt shrinks, the pieces grow without bound (right panel, $|w|$ against the tilt); at $0^\circ$ the line falls into $U$, $U\cap W=W$ (red) and uniqueness — even existence — is lost. With two planes the intersection is always a line, so two planes in $\R^3$ never form a direct sum.`,
      deps: ['ladr-1.45', 'ladr-1.41'],
      tags: ['direct sums'],
      viz(v) {
        const M = v.M;
        const nU = unit([0.18, -0.28, 1]), [aU, bU] = planeBasis(nU);
        const sp = v.select('', [{ value: 'PL', label: 'plane $U$ and line $W$' }, { value: 'PP', label: 'two planes' }], 'PL', { onChange: () => relayout() });
        const tilt = v.slider('tilt of $W$ out of $U$', -90, 90, 32, { step: 0.5, fmt: (x) => `${x.toFixed(1)}°` });
        const az = v.slider('turn $W$', 0, 360, 150, { step: 1, fmt: (x) => `${x.toFixed(0)}°` });
        const S = v.stage({ x: [-2, 2], y: [-1.75, 1.75], equal: true, axes: false, height: 400, weight: 1.45 });
        const G = v.stage({ x: [-90, 90], y: [0, 5], height: 400, axes: 'box', weight: 0.85, minWidth: 230, xlabel: 'tilt', title: 'size $|w|$ of the $W$-piece of $v$', xticks: [[-90, '−90°'], [-45, '−45°'], [0, '0°'], [45, '45°'], [90, '90°']] });
        const relayout = () => layout(v, [[S, true], [G, sp.value === 'PL']]);
        relayout();
        const sc = scene3(v, S);
        const Vh = sc.handle([0.55, -0.35, 0.75], { color: 'gold', label: 'v' });
        const inU = (deg) => { const t = (deg * Math.PI) / 180; return add3(scl3(aU, Math.cos(t)), scl3(bU, Math.sin(t))); };
        const dirW = (b, a) => { const t = (b * Math.PI) / 180; return add3(scl3(inU(a), Math.cos(t)), scl3(nU, Math.sin(t))); };
        v.legend([['blue', '$U$, $u$'], ['orange', '$W$, $w$'], ['gold', '$v$'], ['red', '$U\\cap W\\ne\\{0\\}$']]);
        let st = {};
        v.render(() => {
          const m = sp.value, b = tilt.value, a = az.value, x = Vh.p, d = dirW(b, a), flat = b === 0;
          sc.begin();
          sc.disc(aU, bU, 1.45, { color: 'blue', fillAlpha: 0.11, grid: true });
          let u = null, w = null, info;
          if (m === 'PL') {
            line3(sc, d, flat ? 'red' : 'orange', 1.75, { width: flat ? 5 : 4, alpha: flat ? 0.75 : 0.5, bias: flat ? -0.5 : 0 });
            const nd = dot3(nU, d), nx = dot3(nU, x);
            if (!flat) { w = scl3(d, nx / nd); u = sub3(x, w); info = { kind: 'unique' }; }
            else if (Math.abs(nx) < 1e-9) info = { kind: 'many' };
            else info = { kind: 'none' };
            if (flat) { const k = scl3(d, 0.9); sc.arrow([0, 0, 0], k, { color: 'red', width: 2.4 }); sc.arrow([0, 0, 0], scl3(k, -1), { color: 'red', width: 2.4, dash: [5, 4] }); sc.tex('0 = k + (-k)', k, { color: 'red', align: 'left', dx: 10, dy: -10, size: 13 }); }
          } else {
            // W = span{d, e} with e ∈ U perpendicular to the turning direction: U ∩ W ⊇ span{e}
            const e = inU(a + 90), nW = unit(cross3(d, e)), wb = unit(cross3(nW, e));
            sc.disc(e, wb, 1.45, { color: 'orange', fillAlpha: 0.11, grid: true });
            line3(sc, e, 'red', 1.75, { width: 4.5, alpha: 0.75, bias: -0.5 });
            if (!flat) {
              const f = cross3(nU, e), c = M.solve([0, 1, 2].map((i) => [e[i], f[i], wb[i]]), x);
              u = add3(scl3(e, c[0] / 2), scl3(f, c[1])); w = add3(scl3(e, c[0] / 2), scl3(wb, c[2]));
              for (const tt of [-0.8, 0.8]) { const uu = add3(u, scl3(e, tt)), ww = sub3(w, scl3(e, tt)); sc.line(uu, x, { color: 'blue', width: 1, alpha: 0.3 }); sc.line(ww, x, { color: 'orange', width: 1, alpha: 0.3 }); sc.dot(uu, { r: 2.5, color: 'blue', alpha: 0.6, ring: false }); sc.dot(ww, { r: 2.5, color: 'orange', alpha: 0.6, ring: false }); }
            }
            info = { kind: flat ? 'same' : 'pp' };
          }
          if (u) {
            sc.line(u, x, { color: 'muted', width: 1.2, dash: [4, 4] }); sc.line(w, x, { color: 'muted', width: 1.2, dash: [4, 4] });
            sc.arrow([0, 0, 0], u, { color: 'blue', width: 3 }); sc.arrow([0, 0, 0], w, { color: 'orange', width: 3 });
            sc.tex('u', u, { color: 'blue', dx: 10, dy: 12, size: 14 }); sc.tex('w', w, { color: 'orange', dx: 10, dy: -12, size: 14 });
          }
          sc.arrow([0, 0, 0], x, { color: 'gold', width: 2, alpha: 0.8 });
          sc.dot([0, 0, 0], { r: 3.5, color: 'ink' });
          sc.flush();
          const direct = m === 'PL' && !flat;
          S.corner(direct ? 'U ∩ W = {0}: direct' : m === 'PL' ? 'U ∩ W = W: not direct' : 'U ∩ W is a line: not direct', 'tl', { color: direct ? 'green' : 'red', weight: 600 });
          // |w| against the tilt, for the current v and turn
          const nx = Math.abs(dot3(nU, x)), f = (t) => (Math.abs(t) < 1e-9 ? Infinity : nx / Math.abs(Math.sin((t * Math.PI) / 180)));
          G.setView([-90, 90], [0, Math.max(2.5, nx * 4)]);
          G.vline(0, { color: 'red', width: 1.2, dash: [4, 4] });
          G.fn(f, { color: 'orange', width: 2.5, n: 400 });
          if (!flat) G.dot(b, f(b), { r: 5.5, color: 'orange' });
          G.corner(nx < 1e-6 ? 'v ∈ U: then w = 0' : '|w| = |⟨v, n⟩| / |sin tilt|', 'tr', { color: 'muted', size: 11 });
          st = { m, b, u, w, x, info };
        });
        v.readout(() => {
          const { m, b, u, w, info } = st; if (!info) return '';
          if (info.kind === 'unique') return `Tilt $${tn(b, 1)}^\\circ$: $U\\cap W=\\{0\\}$, and $v$ splits in exactly one way, $u = ${vtex(u)}\\in U$, $w = ${vtex(w)}\\in W$ ($|w| = ${tn(len3(w), 2)}$). So $U\\oplus W$ (here $=\\R^3$).`;
          if (info.kind === 'none') return `Tilt $0^\\circ$: $W\\subset U$, so $U\\cap W=W\\ne\\{0\\}$. Then $0=k+(-k)$ for any $k\\in W$ — two ways of writing $0$ — and the sum is **not** direct; this $v$ (outside the plane) is not in $U+W=U$ at all.`;
          if (info.kind === 'many') return `Tilt $0^\\circ$ and $v\\in U$: now $v=(v-k)+k$ for every $k\\in W$ — infinitely many decompositions, because $U\\cap W=W\\ne\\{0\\}$.`;
          if (info.kind === 'same') return `Tilt $0^\\circ$: the two planes coincide, $U\\cap W=U$. Certainly not direct.`;
          return `Two planes through $0$ in $\\R^3$ always share a line (red), so $U\\cap W\\ne\\{0\\}$: one decomposition $u = ${vtex(u)}$, $w = ${vtex(w)}$ is drawn, and sliding along the shared line gives the others (faint). Never a direct sum.`;
        });
      },
    },
  ],
};
