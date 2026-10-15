// Axler, Linear Algebra Done Right (4th ed.) — Chapter 1: Vector Spaces
// Part 1 (this file): complex numbers, Fⁿ, the definition of a vector space and its first consequences (1.1–1.31).
// Part 2 (ch01-b.js): (−1)v = −v, subspaces, sums and direct sums (1.32–1.46).

// ---------- shared helpers ----------
/** A number for TeX with d decimals and no "-0". */
function tn(x, d = 2) { return (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d); }
/** Same, but wrapped in parentheses when negative (for products like 2·(−1)). */
function tp(x, d = 2) { const s = tn(x, d); return s[0] === '-' ? `(${s})` : s; }
/** A complex number a + bi for TeX. */
function ctex(z, d = 2) {
  const e = 0.5 * 10 ** -d, re = Math.abs(z.re) < e ? 0 : z.re, im = Math.abs(z.im) < e ? 0 : z.im;
  if (im === 0) return re.toFixed(d);
  if (re === 0) return `${im < 0 ? '-' : ''}${Math.abs(im).toFixed(d)}i`;
  return `${re.toFixed(d)} ${im < 0 ? '-' : '+'} ${Math.abs(im).toFixed(d)}i`;
}
/** A list (x₁,…,xₙ) for TeX. */
const vtex = (p, d = 2) => `(${p.map((x) => tn(x, d)).join(',\\ ')})`;
/** Arrow p → q on a 2D stage with an optional KaTeX label just beyond the tip. */
function arrow2(S, p, q, color, label, o = {}) {
  S.arrow(p[0], p[1], q[0], q[1], { color, width: o.width ?? 2.6, head: o.head ?? 10, dash: o.dash, alpha: o.alpha });
  if (label) {
    const dx = S.X(q[0]) - S.X(p[0]), dy = S.Y(q[1]) - S.Y(p[1]), L = Math.hypot(dx, dy) || 1, off = o.off ?? 15;
    S.tex(label, q[0], q[1], { color, size: o.size ?? 15, dx: (dx / L) * off + (o.dx || 0), dy: (dy / L) * off + (o.dy || 0) });
  }
}
/** Show or hide a stage (the runtime's .stage display rule overrides the bare hidden attribute). */
function show(S, on) { S.el.hidden = !on; S.el.style.display = on ? '' : 'none'; }
/** Circular arc of radius r about the origin from angle t0 to t1. */
function arc(S, r, t0, t1, st) { if (Math.abs(t1 - t0) > 1e-3) S.curve((t) => [r * Math.cos(t), r * Math.sin(t)], t0, t1, { n: 60, ...st }); }
/** Point at fraction s ∈ [0,1] along a polyline (equal time per segment) and the part already walked. */
function along(pts, s) {
  const n = pts.length - 1, u = Math.min(n - 1e-9, Math.max(0, s * n)), k = Math.floor(u), f = u - k;
  const p = pts[k].map((c, i) => c + (pts[k + 1][i] - c) * f);
  return { p, done: pts.slice(0, k + 1).concat([p]) };
}
/** Unit-free distance-limited drag: keep (x, y) within radius r of the origin. */
const disc = (r) => (x, y) => { const n = Math.hypot(x, y); return n > r ? [(x * r) / n, (y * r) / n] : [x, y]; };

/**
 * A rotatable 3D picture drawn on a 2D stage, so that vectors in ℝ³ can carry draggable handles
 * (the runtime's stage3d has none). Orthographic view, yaw about the vertical axis then pitch, like stage3d;
 * painter's algorithm: fills and line pieces sorted by depth, then arrows/dots on top. Drag the background to rotate.
 * Handles: mode 'free' (moves parallel to the screen), 'plane' (stays in span{a, b}), 'line' (stays on span{d}).
 */
function scene3(v, S, o = {}) {
  const M = v.M;
  const sc = { yaw: o.yaw ?? -0.62, pitch: o.pitch ?? 0.34, L: o.axis ?? 1.75, lim: o.lim ?? 1.6, labels: o.labels ?? ['x', 'y', 'z'], q: [], top: [], hs: [] };
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
  sc.dots = (pts, st = {}) => { const Q = pts.map(P); push(st.d ?? 0, () => S.dots(Q.map((p) => [p[0], p[1]]), st), st.top ?? true); return sc; };
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

export default {
  collection: 'ladr',
  chapter: 1,
  title: 'Vector Spaces',
  summary: String.raw`The chapter starts from the complex numbers and the coordinate spaces $\mathbf F^n$ (where $\mathbf F$ stands for $\R$ or $\C$), isolates the rules that vector addition and scalar multiplication obey, and turns them into the axioms of an abstract vector space. The first consequences follow from the axioms alone: there is only one zero vector, each vector has only one additive inverse, $0v=0$, $a0=0$ and $(-1)v=-v$. The second half studies subspaces, with a three-condition test for recognising them, and sums of subspaces, singling out the direct sums — the sums in which every vector splits into pieces in exactly one way, which happens exactly when $0$ splits only trivially, and for two subspaces exactly when they meet only in $0$.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Complex numbers',
      statement: String.raw`A *complex number* is an ordered pair $(a,b)$ of real numbers, written $a+bi$. The set of all complex numbers is
$$\C=\{a+bi : a,b\in\R\}.$$
*Addition* and *multiplication* on $\C$ are defined by
$$(a+bi)+(c+di)=(a+c)+(b+d)i,\qquad (a+bi)(c+di)=(ac-bd)+(ad+bc)i$$
for $a,b,c,d\in\R$. The real number $a$ is identified with $a+0i$, so $\R\subset\C$, and $0+bi$ is written $bi$. In particular $i=0+1i$, and the multiplication rule gives $i^2=-1$.`,
      idea: String.raw`The multiplication rule is what you get by expanding $(a+bi)(c+di)$ with the usual laws of algebra and replacing $i^2$ by $-1$ — but nothing mysterious is assumed: a complex number *is* a point $(a,b)$ of the plane, and $i^2=-1$ is a computation, $(0+1i)(0+1i)=(0\cdot0-1\cdot1)+(0\cdot1+1\cdot0)i$. Addition is the parallelogram rule for the points $(a,b)$ and $(c,d)$. Written in polar form, the multiplication rule multiplies the distances from $0$ and adds the angles from the positive real axis, so multiplying by $i$ is a quarter turn.`,
      caption: String.raw`Drag $\alpha$ and $\beta$. *Sum*: $\alpha+\beta$ is the far corner of the parallelogram. *Product*: the arcs mark the angles of $\alpha$, $\beta$ and $\alpha\beta$ — the third is the sum of the first two — and the readout recomputes $\alpha\beta$ from the defining formula. *Powers of $i$*: each multiplication by $i$ is a quarter turn, so $i^2\alpha=-\alpha$.`,
      deps: [],
      tags: ['complex numbers'],
      credit: 'Hamilton, 1837 (complex numbers as pairs of reals)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Complex_number' },
      viz(v) {
        const cx = v.cx, I = cx(0, 1);
        const mode = v.select('', [{ value: 'sum', label: 'sum $\\alpha+\\beta$' }, { value: 'prod', label: 'product $\\alpha\\beta$' }, { value: 'i', label: 'powers of $i$' }], 'prod');
        const S = v.stage({ x: [-3, 3], y: [-2.7, 2.7], equal: true, height: 400, ticks: false, xlabel: 'Re', ylabel: 'Im' });
        const A = S.handle(1.45, 0.55, { color: 'blue', label: 'α', constrain: disc(1.6) });
        const B = S.handle(0.55, 1.2, { color: 'orange', label: 'β', constrain: disc(1.6) });
        let st = {};
        v.render(() => {
          const m = mode.value, a = cx(A.x, A.y), b = cx(B.x, B.y);
          B.visible = m !== 'i';
          S.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 4] });
          if (m === 'sum') {
            const s = a.add(b);
            S.poly([[0, 0], [a.re, a.im], [s.re, s.im], [b.re, b.im]], { fill: 'green', fillAlpha: 0.08, stroke: false });
            arrow2(S, [a.re, a.im], [s.re, s.im], 'orange', null, { alpha: 0.45, width: 2, dash: [5, 4] });
            arrow2(S, [b.re, b.im], [s.re, s.im], 'blue', null, { alpha: 0.45, width: 2, dash: [5, 4] });
            arrow2(S, [0, 0], [a.re, a.im], 'blue'); arrow2(S, [0, 0], [b.re, b.im], 'orange');
            arrow2(S, [0, 0], [s.re, s.im], 'green', '\\alpha+\\beta', { width: 3 });
            // real and imaginary parts add separately
            S.line(s.re, 0, s.re, s.im, { color: 'green', width: 1, dash: [2, 4], alpha: 0.7 });
            S.line(0, s.im, s.re, s.im, { color: 'green', width: 1, dash: [2, 4], alpha: 0.7 });
            S.dot(s.re, 0, { r: 3, color: 'green' }); S.dot(0, s.im, { r: 3, color: 'green' });
            st = { m, a, b, s };
          } else if (m === 'prod') {
            const p = a.mul(b), ta = a.arg(), tb = b.arg();
            S.circle(0, 0, p.abs(), { color: 'green', width: 1, alpha: 0.4, dash: [2, 5] });
            arc(S, 0.36, 0, ta, { color: 'blue', width: 2.2 });
            arc(S, 0.5, 0, tb, { color: 'orange', width: 2.2 });
            arc(S, 0.64, 0, ta + tb, { color: 'green', width: 2.2 });
            arrow2(S, [0, 0], [a.re, a.im], 'blue'); arrow2(S, [0, 0], [b.re, b.im], 'orange');
            arrow2(S, [0, 0], [p.re, p.im], 'green', '\\alpha\\beta', { width: 3 });
            S.dot(1, 0, { r: 3.5, color: 'ink' }); S.tex('1', 1, 0, { dx: 7, dy: 13, size: 13, color: 'muted' });
            st = { m, a, b, p, ta, tb };
          } else {
            const pw = [a, a.mul(I), a.mul(I).mul(I), a.mul(I).mul(I).mul(I)];
            S.poly(pw.map((z) => [z.re, z.im]), { color: 'muted', width: 1, dash: [4, 4], fill: 'purple', fillAlpha: 0.05 });
            const cols = ['blue', 'purple', 'red', 'teal'], labs = [null, 'i\\alpha', 'i^2\\alpha', 'i^3\\alpha'];
            const r0 = Math.min(0.5, 0.45 * a.abs());
            for (let k = 0; k < 3; k++) arc(S, r0, a.arg() + (k * Math.PI) / 2 + 0.08, a.arg() + ((k + 1) * Math.PI) / 2 - 0.08, { color: cols[k + 1], width: 1.6, alpha: 0.8 });
            pw.forEach((z, k) => arrow2(S, [0, 0], [z.re, z.im], cols[k], labs[k]));
            [[1, 0, '1', 13, 12], [0, 1, 'i', -12, -12], [-1, 0, '-1', -14, 12], [0, -1, '-i', 14, 12]].forEach(([x, y, l, dx, dy]) => { S.dot(x, y, { r: 3.2, color: 'ink' }); S.tex(l, x, y, { dx, dy, size: 13, color: 'muted' }); });
            st = { m, a, pw };
          }
        });
        v.readout(() => {
          const { m, a, b } = st; if (!m) return '';
          if (m === 'sum') return `$\\alpha+\\beta = (${tn(a.re)} + ${tp(b.re)}) + (${tn(a.im)} + ${tp(b.im)})i = ${ctex(st.s)}$ — real parts add, imaginary parts add: the parallelogram rule in the plane.`;
          if (m === 'prod') {
            const p = st.p, deg = (t) => tn((t * 180) / Math.PI, 1);
            return `$\\alpha\\beta = (ac-bd)+(ad+bc)i = (${tp(a.re)}\\cdot${tp(b.re)} - ${tp(a.im)}\\cdot${tp(b.im)}) + (${tp(a.re)}\\cdot${tp(b.im)} + ${tp(a.im)}\\cdot${tp(b.re)})i = ${ctex(p)}$. Lengths multiply: $|\\alpha\\beta| = ${tn(p.abs(), 3)} = ${tn(a.abs(), 3)}\\cdot${tn(b.abs(), 3)} = |\\alpha|\\,|\\beta|$; angles add: $${deg(st.ta)}^\\circ + ${deg(st.tb)}^\\circ = ${deg(st.ta + st.tb)}^\\circ$.`;
          }
          return `$i\\cdot i = (0+1i)(0+1i) = (0\\cdot0 - 1\\cdot1) + (0\\cdot1+1\\cdot0)i = -1$, so $i^2\\alpha = -\\alpha = ${ctex(st.pw[2])}$. Multiplying $\\alpha = a+bi$ by $i$ gives $-b+ai$: the quarter turn $(a,b)\\mapsto(-b,a)$, and $i^4\\alpha = \\alpha$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Theorem',
      name: 'Properties of complex arithmetic',
      statement: String.raw`For all $\alpha,\beta,\lambda\in\C$:
- **commutativity:** $\alpha+\beta=\beta+\alpha$ and $\alpha\beta=\beta\alpha$;
- **associativity:** $(\alpha+\beta)+\lambda=\alpha+(\beta+\lambda)$ and $(\alpha\beta)\lambda=\alpha(\beta\lambda)$;
- **identities:** $\lambda+0=\lambda$ and $\lambda1=\lambda$;
- **additive inverse:** for every $\alpha\in\C$ there is a unique $\beta\in\C$ with $\alpha+\beta=0$;
- **multiplicative inverse:** for every $\alpha\in\C$ with $\alpha\neq0$ there is a unique $\beta\in\C$ with $\alpha\beta=1$;
- **distributive property:** $\lambda(\alpha+\beta)=\lambda\alpha+\lambda\beta$.`,
      idea: String.raw`Write each number as $a+bi$ and use the definitions of Definition 1.1: every identity reduces to identities between real numbers. For example $\alpha\beta=\beta\alpha$ because $(ac-bd)+(ad+bc)i=(ca-db)+(cb+da)i$. The inverse of $a+bi\ne0$ is $\frac{a}{a^2+b^2}-\frac{b}{a^2+b^2}\,i$, and uniqueness comes from the usual one-line argument. Geometrically, multiplying by $\lambda$ rotates and scales the whole plane about $0$, so it carries a parallelogram to a parallelogram — that is the distributive law.`,
      caption: String.raw`Drag $\alpha$, $\beta$ (and $\lambda$). *Commutativity*: the triangle $0,1,\alpha$ rebuilt on the side $0\beta$ and the triangle $0,1,\beta$ rebuilt on $0\alpha$ share their apex $\alpha\beta=\beta\alpha$. *Associativity*: the spirals multiply continuously by $\lambda$ and by $\alpha$ and arrive at the same point. *Distributivity*: multiplying by $\lambda$ maps the parallelogram of $\alpha,\beta$ onto the parallelogram of $\lambda\alpha,\lambda\beta$. *Inverses*: drag $\alpha$ to $0$ and $1/\alpha$ escapes to infinity.`,
      deps: ['ladr-1.1'],
      tags: ['complex numbers'],
      viz(v) {
        const cx = v.cx;
        const prop = v.select('', [{ value: 'comm', label: 'commutativity' }, { value: 'assoc', label: 'associativity' }, { value: 'dist', label: 'distributivity' }, { value: 'inv', label: 'identities & inverses' }], 'dist');
        const S = v.stage({ x: [-3, 3], y: [-2.7, 2.7], equal: true, height: 420, ticks: false, xlabel: 'Re', ylabel: 'Im' });
        const A = S.handle(1.15, 0.4, { color: 'blue', label: 'α', constrain: (x, y) => { const [u, w] = disc(1.6)(x, y); return prop.value === 'inv' && Math.hypot(u, w) < 0.07 ? [0, 0] : [u, w]; } });
        const B = S.handle(-0.3, 1.05, { color: 'orange', label: 'β', constrain: disc(1.6) });
        const L = S.handle(0.85, 0.7, { color: 'purple', label: 'λ', constrain: disc(1.45) });
        const pt = (z) => [z.re, z.im];
        let st = {};
        v.render(() => {
          const m = prop.value, a = cx(A.x, A.y), b = cx(B.x, B.y), l = cx(L.x, L.y);
          B.visible = m !== 'inv'; L.visible = m === 'assoc' || m === 'dist';
          if (m === 'comm') {
            const ab = a.mul(b), ba = b.mul(a);
            S.poly([[0, 0], [1, 0], pt(a)], { fill: 'blue', fillAlpha: 0.08, color: 'blue', width: 1, alpha: 0.4 });
            S.poly([[0, 0], [1, 0], pt(b)], { fill: 'orange', fillAlpha: 0.08, color: 'orange', width: 1, alpha: 0.4 });
            S.poly([[0, 0], pt(b), pt(ab)], { fill: 'blue', fillAlpha: 0.2, color: 'blue', width: 1.6 });
            S.poly([[0, 0], pt(a), pt(ba)], { fill: 'orange', fillAlpha: 0.2, color: 'orange', width: 1.6 });
            S.dot(1, 0, { r: 3.5, color: 'ink' }); S.tex('1', 1, 0, { dy: 13, size: 13, color: 'muted' });
            S.dot(ab.re, ab.im, { r: 6, color: 'green' });
            S.tex('\\alpha\\beta=\\beta\\alpha', ab.re, ab.im, { color: 'green', dy: -17, size: 15 });
            st = { m, lhs: ab, rhs: ba };
          } else if (m === 'assoc') {
            const ab = a.mul(b), bl = b.mul(l), r1 = ab.mul(l), r2 = a.mul(bl);
            const spiral = (z0, w) => { if (w.abs() < 1e-6) return [pt(z0), [0, 0]]; const lw = w.log(); const out = []; for (let k = 0; k <= 60; k++) out.push(pt(z0.mul(lw.scale(k / 60).exp()))); return out; };
            S.path(spiral(ab, l), { color: 'blue', width: 2.2, dash: [5, 4] });
            S.path(spiral(bl, a), { color: 'orange', width: 2.2, dash: [5, 4] });
            arrow2(S, [0, 0], pt(ab), 'blue', '\\alpha\\beta', { width: 1.8, alpha: 0.8 });
            arrow2(S, [0, 0], pt(bl), 'orange', '\\beta\\lambda', { width: 1.8, alpha: 0.8 });
            arrow2(S, [0, 0], pt(r1), 'green', '(\\alpha\\beta)\\lambda=\\alpha(\\beta\\lambda)', { width: 3, off: 20 });
            st = { m, lhs: r1, rhs: r2 };
          } else if (m === 'dist') {
            const s = a.add(b), la = l.mul(a), lb = l.mul(b), r1 = l.mul(s), r2 = la.add(lb);
            S.poly([[0, 0], pt(a), pt(s), pt(b)], { fill: 'muted', fillAlpha: 0.08, color: 'muted', width: 1.2, dash: [4, 4] });
            S.poly([[0, 0], pt(la), pt(r2), pt(lb)], { fill: 'green', fillAlpha: 0.12, color: 'green', width: 1.4 });
            arrow2(S, [0, 0], pt(a), 'blue', null, { width: 2, alpha: 0.6 }); arrow2(S, [0, 0], pt(b), 'orange', null, { width: 2, alpha: 0.6 });
            arrow2(S, [0, 0], pt(s), 'muted', '\\alpha+\\beta', { width: 1.6 });
            arrow2(S, [0, 0], pt(la), 'blue', '\\lambda\\alpha'); arrow2(S, [0, 0], pt(lb), 'orange', '\\lambda\\beta');
            arrow2(S, [0, 0], pt(r1), 'green', '\\lambda(\\alpha+\\beta)', { width: 3 });
            S.dot(r2.re, r2.im, { r: 4, color: 'green' });
            st = { m, lhs: r1, rhs: r2 };
          } else {
            S.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 4] });
            S.dot(0, 0, { r: 4, color: 'ink' }); S.tex('0', 0, 0, { dx: -10, dy: 12, size: 13, color: 'muted' });
            S.dot(1, 0, { r: 4, color: 'ink' }); S.tex('1', 1, 0, { dx: 8, dy: 13, size: 13, color: 'muted' });
            const zero = a.abs() < 1e-9;
            arrow2(S, [0, 0], pt(a.neg()), 'teal', '-\\alpha');
            if (!zero) {
              const inv = a.inv(), cj = a.conj(), far = inv.abs() > 2.6;
              S.line(0, 0, cj.re * 9, cj.im * 9, { color: 'purple', width: 1, dash: [2, 4], alpha: 0.6 });
              S.dot(cj.re, cj.im, { r: 3, color: 'purple', alpha: 0.6 }); S.tex('\\bar\\alpha', cj.re, cj.im, { dx: 12, dy: 10, size: 13, color: 'purple' });
              const tip = far ? inv.scale(2.6 / inv.abs()) : inv;
              arrow2(S, [0, 0], pt(tip), 'purple', far ? '1/\\alpha\\ (\\text{further out})' : '1/\\alpha', { dash: far ? [5, 4] : null });
            }
            st = { m, a, zero };
          }
        });
        v.readout(() => {
          const s = st; if (!s.m) return '';
          if (s.m === 'inv') {
            if (s.zero) return `$\\alpha = 0$: then $\\alpha\\beta = 0 \\ne 1$ for every $\\beta$ — **no multiplicative inverse**, which is why the theorem requires $\\alpha\\ne0$. The additive inverse $-\\alpha = 0$ still exists.`;
            const inv = s.a.inv(), p = s.a.mul(inv), q = s.a.add(s.a.neg());
            return `$-\\alpha = ${ctex(s.a.neg())}$ and $\\alpha+(-\\alpha) = ${ctex(q)}$; $\\;1/\\alpha = \\dfrac{a}{a^2+b^2} - \\dfrac{b}{a^2+b^2}i = ${ctex(inv, 3)}$ and $\\alpha\\cdot\\frac1\\alpha = ${ctex(p, 3)}$. Construction: reflect $\\alpha$ to $\\bar\\alpha$, then divide by $|\\alpha|^2 = ${tn(s.a.abs2(), 3)}$.`;
          }
          const d = s.lhs.sub(s.rhs).abs();
          const names = { comm: ['\\alpha\\beta', '\\beta\\alpha'], assoc: ['(\\alpha\\beta)\\lambda', '\\alpha(\\beta\\lambda)'], dist: ['\\lambda(\\alpha+\\beta)', '\\lambda\\alpha+\\lambda\\beta'] }[s.m];
          return `$${names[0]} = ${ctex(s.lhs, 3)}$, $\\;${names[1]} = ${ctex(s.rhs, 3)}$, $\\;|\\text{difference}| = ${v.sci(d, 2)}$` + (d > 0 ? ' (floating-point rounding only)' : '') + '. The same holds for every choice: each side expands to the same real expressions in $a,b,c,d,\\dots$';
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Definition',
      name: 'The coordinate space Fⁿ',
      statement: String.raw`Here $\mathbf F$ denotes $\R$ or $\C$, and $n$ is a positive integer. A *list of length $n$* is an ordered collection $(x_1,\dots,x_n)$ of $n$ objects; order matters and repetitions are allowed. Then
$$\mathbf F^n=\{(x_1,\dots,x_n): x_k\in\mathbf F \text{ for } k=1,\dots,n\}$$
is the set of all lists of length $n$ of elements of $\mathbf F$, and for $(x_1,\dots,x_n)\in\mathbf F^n$ and $k\in\{1,\dots,n\}$ the number $x_k$ is its *$k$-th coordinate*.`,
      idea: String.raw`$\R^2$ and $\R^3$ are the plane and space of coordinate geometry, a point being identified with its list of coordinates. The definition works for every $n$, so $\R^4$ or $\R^{100}$ make perfect algebraic sense although they cannot be drawn. Over $\C$ each coordinate is itself a point of a plane: $\C^1$ looks like $\R^2$ as a set but has a single coordinate, and $\C^2$ is best pictured as two planes, one per coordinate.`,
      caption: String.raw`In $\R^3$, use the sliders or drag $x$ (it moves parallel to the screen; drag the background to rotate): the dashed box reads off the three coordinates. Switch to $\R^2$, $\C^1$ or $\C^2$: in $\C^2$ the point is a pair of complex numbers, so it needs one plane for each coordinate.`,
      deps: ['ladr-1.1'],
      tags: ['vector spaces'],
      viz(v) {
        const cx = v.cx;
        const sp = v.select('', [{ value: 'R2', label: '$\\R^2$' }, { value: 'R3', label: '$\\R^3$' }, { value: 'C1', label: '$\\C^1$' }, { value: 'C2', label: '$\\C^2$' }], 'R3');
        const S3 = v.stage({ x: [-2, 2], y: [-1.8, 1.8], equal: true, axes: false, height: 400, full: true });
        const P1 = v.stage({ x: [-2.4, 2.4], y: [-2, 2], equal: true, height: 340 });
        const P2 = v.stage({ x: [-2.4, 2.4], y: [-2, 2], equal: true, height: 340 });
        const sc = scene3(v, S3, { labels: ['x₁', 'x₂', 'x₃'] });
        const X = sc.handle([1.1, 0.9, 0.8], { color: 'accent', label: 'x' });
        const s1 = v.slider('$x_1$', -1.6, 1.6, 1.1, { step: 0.01 }), s2 = v.slider('$x_2$', -1.6, 1.6, 0.9, { step: 0.01 }), s3 = v.slider('$x_3$', -1.6, 1.6, 0.8, { step: 0.01 });
        const h1 = P1.handle(1.3, 0.8, { color: 'accent', label: 'x' });
        const h2 = P2.handle(-0.9, 1.1, { color: 'teal', label: 'x₂' });
        let last = [s1.value, s2.value, s3.value], lastMode = null;
        const axisLab = (S, a, b) => { S.text(a, S.bounds.x[1] - 6 / S.scale, 0, { math: true, color: 'muted', align: 'right', baseline: 'bottom', dy: -4 }); S.text(b, 0, S.bounds.y[1], { math: true, color: 'muted', align: 'left', baseline: 'top', dx: 7, dy: 5 }); };
        v.render(() => {
          const m = sp.value;
          show(S3, m === 'R3'); show(P1, m !== 'R3'); show(P2, m === 'C2');
          for (const s of [s1, s2, s3]) s.el.hidden = m !== 'R3';
          if (m !== lastMode) {
            lastMode = m;
            P1.setTitle({ R2: 'the point $x=(x_1,x_2)\\in\\R^2$', C1: '$x=(x_1)\\in\\C^1$: one coordinate, a complex number', C2: 'first coordinate $x_1\\in\\C$' }[m] || 'the plane');
            P2.setTitle('second coordinate $x_2\\in\\C$');
            h1.label = m === 'C2' ? 'x₁' : 'x';
          }
          // sliders ↔ 3D handle
          const sv = [s1.value, s2.value, s3.value];
          if (sv.some((x, i) => x !== last[i])) X.p = sv.slice(); else { s1.value = X.p[0]; s2.value = X.p[1]; s3.value = X.p[2]; }
          last = [s1.value, s2.value, s3.value];
          // ---- ℝ³
          sc.begin();
          const [a, b, c] = X.p, z = [0, 0, 0];
          const box = [[a, 0, 0], [a, b, 0], [0, b, 0], [0, 0, c], [a, 0, c], [a, b, c], [0, b, c]];
          sc.poly([z, [a, 0, 0], [a, b, 0], [0, b, 0]], { fill: 'accent', fillAlpha: 0.08, color: 'accent', alpha: 0.35, width: 1 });
          for (const [p, q] of [[box[0], box[4]], [box[1], box[5]], [box[2], box[6]], [box[3], box[4]], [box[3], box[6]], [box[4], box[5]], [box[5], box[6]]]) sc.line(p, q, { color: 'muted', width: 1, dash: [3, 4], alpha: 0.7 });
          sc.arrow(z, X.p, { color: 'accent', width: 3 });
          sc.dot([a, 0, 0], { r: 4, color: 'blue' }); sc.dot([0, b, 0], { r: 4, color: 'orange' }); sc.dot([0, 0, c], { r: 4, color: 'purple' });
          sc.tex(tn(a), [a, 0, 0], { color: 'blue', size: 13, dy: 14 }); sc.tex(tn(b), [0, b, 0], { color: 'orange', size: 13, dy: 14 }); sc.tex(tn(c), [0, 0, c], { color: 'purple', size: 13, dx: -22 });
          sc.flush();
          // ---- planes
          if (m === 'R2') axisLab(P1, 'x₁', 'x₂'); else axisLab(P1, 'Re', 'Im');
          axisLab(P2, 'Re', 'Im');
          const draw = (S, h, col) => {
            S.line(h.x, 0, h.x, h.y, { color: 'muted', width: 1, dash: [3, 4] }); S.line(0, h.y, h.x, h.y, { color: 'muted', width: 1, dash: [3, 4] });
            arrow2(S, [0, 0], [h.x, h.y], col, null, { width: 2.6 });
            S.dot(h.x, 0, { r: 3.5, color: 'blue' }); S.dot(0, h.y, { r: 3.5, color: 'orange' });
          };
          draw(P1, h1, 'accent'); draw(P2, h2, 'teal');
        });
        v.readout(() => {
          const m = sp.value;
          if (m === 'R3') return `$x = (x_1,x_2,x_3) = ${vtex(X.p)}\\in\\R^3$ — a list of length $3$; each coordinate is a real number, read off along one edge of the box.`;
          if (m === 'R2') return `$x = (x_1,x_2) = ${vtex([h1.x, h1.y])}\\in\\R^2$ — a list of two real numbers.`;
          const z1 = cx(h1.x, h1.y), z2 = cx(h2.x, h2.y);
          if (m === 'C1') return `$x = (x_1) = (${ctex(z1)})\\in\\C^1$ — a list of length $1$. As a set, $\\C^1$ fills a plane, but it has only one coordinate: a complex number.`;
          return `$x = (x_1,x_2) = (${ctex(z1)},\\ ${ctex(z2)})\\in\\C^2$ — a list of length $2$ of complex numbers. Four real numbers describe it, so it cannot be drawn as one point in one picture; one plane per coordinate shows it honestly.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.14
    {
      num: '1.14',
      kind: 'Theorem',
      name: 'Commutativity of addition in Fⁿ',
      statement: String.raw`Addition in $\mathbf F^n$ is defined coordinatewise: $(x_1,\dots,x_n)+(y_1,\dots,y_n)=(x_1+y_1,\dots,x_n+y_n)$. With this addition, $x+y=y+x$ for all $x,y\in\mathbf F^n$.`,
      idea: String.raw`Compute both sides coordinate by coordinate: $x+y=(x_1+y_1,\dots,x_n+y_n)=(y_1+x_1,\dots,y_n+x_n)=y+x$. The middle equality is commutativity of addition in $\mathbf F$ (Theorem 1.3), used once in each of the $n$ coordinates — nothing about $\mathbf F^n$ beyond its coordinates is needed.`,
      caption: String.raw`Drag $x$ and $y$. The gold walker goes along $x$ and then along $y$; the teal walker goes along $y$ and then along $x$. They trace the two halves of a parallelogram and always meet at the same corner. In $\C^2$ the same race runs in each coordinate plane separately — exactly the proof.`,
      deps: ['ladr-1.11', 'ladr-1.3'],
      tags: ['vector spaces'],
      viz(v) {
        const M = v.M, cx = v.cx;
        const sp = v.select('', [{ value: 'R2', label: '$\\R^2$' }, { value: 'R3', label: '$\\R^3$' }, { value: 'C2', label: '$\\C^2$, coordinate by coordinate' }], 'R2');
        const S3 = v.stage({ x: [-2, 2], y: [-1.8, 1.8], equal: true, axes: false, height: 400, full: true });
        const P1 = v.stage({ x: [-2.6, 2.6], y: [-1.7, 2.5], equal: true, height: 360 });
        const P2 = v.stage({ x: [-2.6, 2.6], y: [-1.7, 2.5], equal: true, height: 360 });
        const sc = scene3(v, S3);
        const X3 = sc.handle([1.2, -0.4, 0.4], { color: 'blue', label: 'x' }), Y3 = sc.handle([-0.3, 0.9, 0.8], { color: 'orange', label: 'y' });
        const x1 = P1.handle(1.5, 0.35, { color: 'blue', label: 'x' }), y1 = P1.handle(0.3, 1.2, { color: 'orange', label: 'y' });
        const x2 = P2.handle(-1.1, 0.5, { color: 'blue', label: 'x₂' }), y2 = P2.handle(0.6, 1.0, { color: 'orange', label: 'y₂' });
        let lastMode = null;
        const race = (S, x, y, s, labs) => {
          const xy = [x[0] + y[0], x[1] + y[1]];
          S.poly([[0, 0], x, xy, y], { fill: 'green', fillAlpha: 0.07, stroke: false });
          arrow2(S, x, xy, 'orange', null, { alpha: 0.5, width: 2 }); arrow2(S, y, xy, 'blue', null, { alpha: 0.5, width: 2 });
          arrow2(S, [0, 0], x, 'blue'); arrow2(S, [0, 0], y, 'orange');
          const A = along([[0, 0], x, xy], s), B = along([[0, 0], y, xy], s);
          S.path(A.done, { color: 'gold', width: 8, alpha: 0.3 }); S.path(B.done, { color: 'teal', width: 8, alpha: 0.25 });
          S.dot(A.p[0], A.p[1], { color: 'gold', r: 6 }); S.dot(B.p[0], B.p[1], { color: 'teal', r: 6 });
          S.dot(xy[0], xy[1], { color: 'green', r: 5 });
          S.tex(labs, xy[0], xy[1], { color: 'green', dy: -16, size: 15 });
        };
        v.legend([['gold', 'walk $x$, then $y$', { dot: true }], ['teal', 'walk $y$, then $x$', { dot: true }], ['green', 'the common endpoint', { dot: true }]]);
        v.animate((t) => {
          const m = sp.value, s = M.smoothstep(Math.min(1, t / 3.2));
          show(S3, m === 'R3'); show(P1, m !== 'R3'); show(P2, m === 'C2');
          if (m !== lastMode) {
            lastMode = m;
            x1.label = m === 'C2' ? 'x₁' : 'x'; y1.label = m === 'C2' ? 'y₁' : 'y';
            P1.setTitle(m === 'C2' ? 'first coordinates: $x_1+y_1=y_1+x_1$ in $\\C$' : 'the plane $\\R^2$');
            P2.setTitle('second coordinates: $x_2+y_2=y_2+x_2$ in $\\C$');
          }
          race(P1, [x1.x, x1.y], [y1.x, y1.y], s, m === 'C2' ? 'x_1+y_1' : 'x+y=y+x');
          race(P2, [x2.x, x2.y], [y2.x, y2.y], s, 'x_2+y_2');
          // ℝ³
          sc.begin();
          const x = X3.p, y = Y3.p, xy = M.vadd(x, y), z = [0, 0, 0];
          sc.poly([z, x, xy, y], { fill: 'green', fillAlpha: 0.08, color: 'green', alpha: 0.3 });
          for (const p of [x, y, xy]) sc.line([p[0], p[1], 0], p, { color: 'faint', width: 1, dash: [2, 4] });
          sc.arrow(x, xy, { color: 'orange', alpha: 0.5, width: 2 }); sc.arrow(y, xy, { color: 'blue', alpha: 0.5, width: 2 });
          sc.arrow(z, x, { color: 'blue' }); sc.arrow(z, y, { color: 'orange' });
          const A = along([z, x, xy], s), B = along([z, y, xy], s);
          sc.path(A.done, { color: 'gold', width: 8, alpha: 0.3, top: true }); sc.path(B.done, { color: 'teal', width: 8, alpha: 0.25, top: true });
          sc.dot(A.p, { color: 'gold', r: 6 }); sc.dot(B.p, { color: 'teal', r: 6 }); sc.dot(xy, { color: 'green', r: 5 });
          sc.tex('x+y=y+x', xy, { color: 'green', dx: 48, dy: -4 });
          sc.flush();
        }, { period: 4.6, still: 1.6 });
        v.readout(() => {
          const m = sp.value;
          if (m === 'C2') {
            const a1 = cx(x1.x, x1.y), b1 = cx(y1.x, y1.y), a2 = cx(x2.x, x2.y), b2 = cx(y2.x, y2.y);
            return `$x+y = (x_1+y_1,\\ x_2+y_2) = (${ctex(a1.add(b1))},\\ ${ctex(a2.add(b2))})$ and $y+x = (y_1+x_1,\\ y_2+x_2) = (${ctex(b1.add(a1))},\\ ${ctex(b2.add(a2))})$: equal, because addition in $\\C$ is commutative in each coordinate.`;
          }
          const x = m === 'R3' ? X3.p : [x1.x, x1.y], y = m === 'R3' ? Y3.p : [y1.x, y1.y];
          const sum = x.map((c, i) => `${tn(c)} + ${tp(y[i])}`).join(',\\ '), rev = y.map((c, i) => `${tn(c)} + ${tp(x[i])}`).join(',\\ ');
          return `$x+y = (${sum}) = ${vtex(M.vadd(x, y))}$ and $y+x = (${rev}) = ${vtex(M.vadd(y, x))}$ — the same list, coordinate by coordinate.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.20
    {
      num: '1.20',
      kind: 'Definition',
      name: 'Vector space',
      statement: String.raw`A *vector space* (over $\mathbf F$) is a set $V$ together with an *addition* on $V$ — a function assigning an element $u+w\in V$ to every pair $u,w\in V$ — and a *scalar multiplication* on $V$ — a function assigning an element $av\in V$ to every $a\in\mathbf F$ and $v\in V$ — such that:
- **commutativity:** $u+w=w+u$ for all $u,w\in V$;
- **associativity:** $(u+w)+x=u+(w+x)$ and $(ab)v=a(bv)$ for all $u,w,x,v\in V$ and $a,b\in\mathbf F$;
- **additive identity:** there is an element $0\in V$ with $v+0=v$ for all $v\in V$;
- **additive inverse:** for every $v\in V$ there is $w\in V$ with $v+w=0$;
- **multiplicative identity:** $1v=v$ for all $v\in V$;
- **distributive properties:** $a(u+w)=au+aw$ and $(a+b)v=av+bv$ for all $a,b\in\mathbf F$ and $u,w,v\in V$.

Elements of $V$ are called *vectors* (or points). $V$ is a *real* vector space when $\mathbf F=\R$ and a *complex* one when $\mathbf F=\C$.`,
      idea: String.raw`The list is exactly what $\mathbf F^n$ satisfies (commutativity is Theorem 1.14, and the rest are checked coordinatewise from Theorem 1.3), stripped of any mention of coordinates. That is the point: polynomials, functions on a set $S$ (the space $\mathbf F^S$), sequences and solution sets of linear equations all satisfy the same rules, so every theorem proved from the axioms applies to all of them at once. Being a vector space is a property of the set *together with* its two operations — the same set with a different scalar multiplication can fail.`,
      caption: String.raw`Choose a candidate and drag its elements $u$ (blue) and $w$ (orange); the sliders set the scalars $a,b$. The checklist tests each axiom on your elements and on 300 random ones and shows the first counterexample. Random tests can only refute — for $\R^2$, $\mathcal P_2(\R)$ and $\R^{\{1,2,3\}}$ the axioms hold by real arithmetic — but they catch the half-plane (no negatives) and the twisted scaling (one distributive law fails).`,
      deps: ['ladr-1.1', 'ladr-1.14'],
      see: ['pma-9.1'],
      tags: ['vector spaces'],
      credit: 'Peano, 1888',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Vector_space' },
      viz(v) {
        const M = v.M;
        const add = (u, w) => u.map((c, i) => c + w[i]), smul = (a, u) => u.map((c) => a * c);
        const C = {
          R2: { label: '$\\R^2$', kind: 'plane', add, smul, member: () => true, rand: (r) => [r.uniform(-2, 2), r.uniform(-2, 2)] },
          P2: { label: '$\\mathcal P_2(\\R)$', kind: 'poly', add, smul, member: () => true, rand: (r) => [r.uniform(-1.5, 1.5), r.uniform(-1.5, 1.5), r.uniform(-1.5, 1.5)] },
          F3: { label: '$\\R^{\\{1,2,3\\}}$', kind: 'bars', add, smul, member: () => true, rand: (r) => [r.uniform(-1.5, 1.5), r.uniform(-1.5, 1.5), r.uniform(-1.5, 1.5)] },
          H: { label: 'half-plane $y\\ge0$', kind: 'plane', add, smul, member: (u) => u[1] >= -1e-12, rand: (r) => [r.uniform(-2, 2), r.uniform(0, 2)] },
          T: { label: '$\\R^2$, $a\\cdot(x,y)=(ax,y)$', kind: 'plane', add, smul: (a, u) => [a * u[0], u[1]], member: () => true, rand: (r) => [r.uniform(-2, 2), r.uniform(-2, 2)] },
        };
        const which = v.select('', Object.entries(C).map(([value, c]) => ({ value, label: c.label })), 'H');
        const sa = v.slider('$a$', -2, 2, -0.6, { step: 0.05 }), sb = v.slider('$b$', -2, 2, 0.7, { step: 0.05 });
        let seed = 7;
        v.button('Resample tests', () => { seed += 1; });
        const PL = v.stage({ x: [-2.6, 2.6], y: [-2.4, 2.4], equal: true, height: 400, weight: 1.35 });
        const G = v.stage({ x: [-2.2, 2.2], y: [-3, 3], height: 400, weight: 1.35 });
        const CK = v.stage({ x: [0, 1], y: [0, 8.6], axes: false, height: 400, weight: 1, minWidth: 300 });
        // elements: plane (u, w), polynomials by their values at −1, 0, 1, functions on {1,2,3} by their values
        const U = PL.handle(1.3, 0.9, { color: 'blue', label: 'u', constrain: (x, y) => [x, which.value === 'H' ? Math.max(0, y) : y] });
        const W = PL.handle(-0.6, 1.4, { color: 'orange', label: 'w', constrain: (x, y) => [x, which.value === 'H' ? Math.max(0, y) : y] });
        const NODES = [-1, 0, 1], clampY = (lo, hi) => (x, y) => [x, M.clamp(y, lo, hi)];
        const pu = NODES.map((x, k) => G.handle(x, [0.8, -0.4, 0.6][k], { color: 'blue', r: 6, constrain: (xx, y) => [x, M.clamp(y, -1.8, 1.8)] }));
        const pw = NODES.map((x, k) => G.handle(x, [-0.6, 0.9, 1.2][k], { color: 'orange', r: 6, constrain: (xx, y) => [x, M.clamp(y, -1.8, 1.8)] }));
        const BX = [1, 2, 3];
        const fu = BX.map((x, k) => G.handle(x - 0.17, [1.1, -0.6, 0.5][k], { color: 'blue', r: 6, constrain: (xx, y) => [x - 0.17, M.clamp(y, -1.6, 1.6)] }));
        const fw = BX.map((x, k) => G.handle(x + 0.17, [0.4, 1.0, -0.9][k], { color: 'orange', r: 6, constrain: (xx, y) => [x + 0.17, M.clamp(y, -1.6, 1.6)] }));
        void clampY;
        const quad = (p) => (x) => p[0] * (x * (x - 1)) / 2 + p[1] * (1 - x * x) + p[2] * (x * (x + 1)) / 2;
        const ROWS = [
          ['addition stays in V', 'u+w\\in V'],
          ['scalar multiplication stays in V', 'au\\in V'],
          ['commutativity', 'u+w=w+u'],
          ['associativity', '(u+w)+x=u+(w+x),\\ \\ (ab)u=a(bu)'],
          ['additive identity', '0\\in V,\\ \\ u+0=u'],
          ['additive inverse', 'u+w=0\\ \\text{for some}\\ w\\in V'],
          ['multiplicative identity', '1u=u'],
          ['distributive properties', 'a(u+w)=au+aw,\\ \\ (a+b)u=au+bu'],
        ];
        function runTests(K, cur) {
          const r = v.rng(seed * 7919 + 13), samples = [cur];
          for (let k = 0; k < 300; k++) samples.push({ u: K.rand(r), w: K.rand(r), x: K.rand(r), a: r.uniform(-3, 3), b: r.uniform(-3, 3) });
          const eq = (p, q) => p.every((c, i) => Math.abs(c - q[i]) < 1e-9 * (1 + Math.abs(c) + Math.abs(q[i])));
          const zero = cur.u.map(() => 0), neg = (p) => p.map((c) => -c); // addition is the usual one, so −u is the only candidate inverse
          const tests = [
            (s) => K.member(K.add(s.u, s.w)),
            (s) => K.member(K.smul(s.a, s.u)),
            (s) => eq(K.add(s.u, s.w), K.add(s.w, s.u)),
            (s) => eq(K.add(K.add(s.u, s.w), s.x), K.add(s.u, K.add(s.w, s.x))) && eq(K.smul(s.a * s.b, s.u), K.smul(s.a, K.smul(s.b, s.u))),
            (s) => K.member(zero) && eq(K.add(s.u, zero), s.u),
            (s) => K.member(neg(s.u)) && eq(K.add(s.u, neg(s.u)), zero),
            (s) => eq(K.smul(1, s.u), s.u),
            (s) => eq(K.smul(s.a, K.add(s.u, s.w)), K.add(K.smul(s.a, s.u), K.smul(s.a, s.w))) && eq(K.smul(s.a + s.b, s.u), K.add(K.smul(s.a, s.u), K.smul(s.b, s.u))),
          ];
          return tests.map((f) => { let n = 0, ex = null; samples.forEach((s, i) => { if (f(s)) n++; else if (!ex) ex = { s, cur: i === 0 }; }); return { n, N: samples.length, ex }; });
        }
        let st = {};
        v.render(() => {
          const key = which.value, K = C[key], a = sa.value, b = sb.value;
          show(PL, K.kind === 'plane'); show(G, K.kind !== 'plane');
          U.visible = W.visible = K.kind === 'plane';
          for (const h of [...pu, ...pw]) h.visible = K.kind === 'poly';
          for (const h of [...fu, ...fw]) h.visible = K.kind === 'bars';
          if (K.kind === 'bars') G.setView([0.35, 3.65], [-3.2, 3.2]); else G.setView([-2.2, 2.2], [-3.2, 3.2]);
          let u, w;
          // ---- plane candidates
          {
            const uu = [U.x, U.y], ww = [W.x, W.y], s = K.kind === 'plane' ? K : C.R2;
            if (key === 'H') PL.rect(-20, 0, 20, 20, { fill: 'accent', fillAlpha: 0.07, stroke: false }), PL.hline(0, { color: 'accent', width: 1.5, alpha: 0.6 });
            const sum = s.add(uu, ww), au = s.smul(a, uu);
            PL.poly([[0, 0], uu, sum, ww], { fill: 'green', fillAlpha: 0.06, stroke: false });
            arrow2(PL, uu, sum, 'orange', null, { alpha: 0.4, width: 1.8, dash: [4, 4] }); arrow2(PL, ww, sum, 'blue', null, { alpha: 0.4, width: 1.8, dash: [4, 4] });
            arrow2(PL, [0, 0], uu, 'blue'); arrow2(PL, [0, 0], ww, 'orange');
            arrow2(PL, [0, 0], sum, s.member(sum) ? 'green' : 'red', 'u+w', { width: 2.8 });
            arrow2(PL, [0, 0], au, s.member(au) ? 'purple' : 'red', 'au', { width: 2.4, dash: s.member(au) ? null : [6, 4] });
            if (key === 'T') {
              const l = s.smul(a + b, uu), r = s.add(s.smul(a, uu), s.smul(b, uu));
              arrow2(PL, [0, 0], l, 'teal', '(a+b)u', { width: 2.2 });
              arrow2(PL, [0, 0], r, 'red', 'au+bu', { width: 2.2, dash: [6, 4] });
            }
            if (key === 'H') { const nu = [-uu[0], -uu[1]]; arrow2(PL, [0, 0], nu, 'red', '-u', { width: 1.8, dash: [3, 4], alpha: 0.8 }); }
            if (K.kind === 'plane') { u = uu; w = ww; }
          }
          // ---- polynomials and functions on {1,2,3}
          if (K.kind === 'poly') {
            u = pu.map((h) => h.y); w = pw.map((h) => h.y);
            const f = quad(u), g = quad(w), s = quad(add(u, w)), af = quad(smul(a, u));
            G.fn(af, { color: 'purple', width: 2, dash: [6, 4] });
            G.fn(f, { color: 'blue', width: 2.4 }); G.fn(g, { color: 'orange', width: 2.4 }); G.fn(s, { color: 'green', width: 3 });
            G.tex('u', 1.85, f(1.85), { color: 'blue', dx: 10 }); G.tex('w', 1.85, g(1.85), { color: 'orange', dx: 10 });
            v.legend([['blue', '$u$'], ['orange', '$w$'], ['green', '$u+w$'], ['purple', '$au$', { dash: true }]]);
          } else if (K.kind === 'bars') {
            u = fu.map((h) => h.y); w = fw.map((h) => h.y);
            BX.forEach((x, k) => {
              G.rect(x - 0.27, 0, x - 0.07, u[k], { fill: 'blue', fillAlpha: 0.45, color: 'blue', width: 1 });
              G.rect(x + 0.07, 0, x + 0.27, w[k], { fill: 'orange', fillAlpha: 0.45, color: 'orange', width: 1 });
              G.line(x - 0.34, u[k] + w[k], x + 0.34, u[k] + w[k], { color: 'green', width: 3.5 });
              G.line(x - 0.3, a * u[k], x - 0.04, a * u[k], { color: 'purple', width: 2.5, dash: [4, 3] });
            });
            G.setTicks([[1, '1'], [2, '2'], [3, '3']], null);
            v.legend([['blue', '$u(k)$', { area: true }], ['orange', '$w(k)$', { area: true }], ['green', '$(u+w)(k)$'], ['purple', '$(au)(k)$', { dash: true }]]);
          } else {
            G.setTicks(null, null);
            v.legend([['blue', '$u$'], ['orange', '$w$'], ['green', '$u+w$'], ['purple', '$au$'], ['red', 'outside $V$ / failing', { dash: true }]]);
          }
          if (K.kind !== 'bars') G.setTicks(null, null);
          // ---- checklist
          const res = runTests(K, { u, w, x: K.rand(v.rng(3)), a, b });
          const firstBad = res.findIndex((r) => r.ex);
          ROWS.forEach(([name, f], k) => {
            const y = 8.15 - k * 1.05, ok = !res[k].ex;
            CK.text(ok ? '✓' : '✗', 0.03, y - 0.2, { size: 18, color: ok ? 'green' : 'red', weight: 700 });
            CK.text(name + (ok ? '' : `  (${res[k].N - res[k].n}/${res[k].N} fail)`), 0.13, y, { size: 12, color: ok ? 'muted' : 'red', weight: k === firstBad ? 700 : 500 });
            CK.tex(f, 0.13, y - 0.45, { align: 'left', size: 13.5, color: ok ? 'ink' : 'red' });
          });
          st = { key, K, res, firstBad, u, w, a, b };
        });
        v.readout(() => {
          const { key, K, res, firstBad, u, a, b } = st; if (!res) return '';
          if (firstBad < 0) return `All eight conditions pass on your elements and on 300 random ones. For ${K.label} they hold always: each reduces, coordinate by coordinate (value by value), to a law of real arithmetic. So ${K.label} is a vector space.`;
          if (key === 'H') {
            const au = K.smul(a, u);
            return `Not a vector space. Scalar multiplication leaves the set: e.g. $(${tn(res[1].ex.s.a)})\\cdot${vtex(res[1].ex.s.u)} = ${vtex(K.smul(res[1].ex.s.a, res[1].ex.s.u))}$ has $y<0$` + (a < 0 && u[1] > 0 ? ` (your $au = ${vtex(au)}$ is outside too)` : '') + `; and no $w$ in the half-plane solves $u+w=0$ unless $u$ lies on the edge $y=0$.`;
          }
          if (key === 'T') {
            const l = K.smul(a + b, u), r = K.add(K.smul(a, u), K.smul(b, u));
            return `Not a vector space, although only one rule breaks: $(a+b)u = ${vtex(l)}$ but $au+bu = ${vtex(r)}$ — the second coordinates are $u_2$ and $2u_2$. Every other axiom holds, including $a(u+w)=au+aw$.`;
          }
          return `First failing condition: ${ROWS[firstBad][0]}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.26
    {
      num: '1.26',
      kind: 'Theorem',
      name: 'Unique additive identity',
      statement: String.raw`A vector space has exactly one additive identity: if $0$ and $0'$ both satisfy $v+0=v$ and $v+0'=v$ for every $v\in V$, then $0'=0$.`,
      idea: String.raw`Evaluate $0'+0$ in two ways. Because $0$ is an additive identity, $0'+0=0'$; because $0'$ is one (applied to the vector $0$) and addition is commutative, $0'+0=0+0'=0$. Hence $0'=0'+0=0+0'=0$. Only commutativity and the defining property are used, so the zero vector is pinned down by what it does, not by where it sits — in a space with unusual operations it may be a point other than the origin.`,
      caption: String.raw`Drag the rival $0'$ (red). Each test vector $v$ is joined to $v\oplus 0'$: the red arrows vanish only when $0'$ sits on the true zero, where it snaps. The readout runs the chain $0'=0'\oplus0=0\oplus0'=0$ with live values. In the shifted plane the zero vector is the green point $c$ (drag it), not the origin; in $(0,\infty)$ with $x\oplus y=xy$ it is the number $1$.`,
      deps: ['ladr-1.20'],
      tags: ['vector spaces'],
      viz(v) {
        const M = v.M;
        const sp = v.select('', [{ value: 'R2', label: '$\\R^2$' }, { value: 'sh', label: 'shifted: $u\\oplus w=u+w-c$' }, { value: 'pos', label: '$(0,\\infty)$, $x\\oplus y=xy$' }], 'sh');
        const S = v.stage({ x: [-2.8, 2.8], y: [-2.1, 2.1], equal: true, height: 380, ticks: false });
        const NL = v.stage({ x: [-3.3, 3.3], y: [-0.75, 3], height: 380, axes: false });
        const Cc = S.handle(0.9, 0.6, { color: 'green', label: 'c' });
        const zeroOf = () => (sp.value === 'sh' ? [Cc.x, Cc.y] : [0, 0]);
        const E = S.handle(-1.2, -0.9, { color: 'red', label: "0′", constrain: (x, y) => { const z = zeroOf(); return Math.hypot(x - z[0], y - z[1]) < 0.12 ? z : [x, y]; } });
        const EL = NL.handle(1.3, 0, { color: 'red', label: "0′", constrain: (x) => [Math.abs(x) < 0.08 ? 0 : M.clamp(x, -3, 3), 0] });
        const TESTS = [[-1.9, 1.3], [1.7, 1.45], [0.5, -1.5], [-1.6, -0.2]];
        const TL = [-2.1, 0.6, 1.7]; // test vectors in (0,∞), as log₂ x
        const fmtPos = (x) => (x >= 10 ? tn(x, 1) : x >= 0.1 ? tn(x, 2) : tn(x, 3));
        let st = {};
        v.render(() => {
          const m = sp.value;
          show(S, m !== 'pos'); show(NL, m === 'pos'); Cc.visible = m === 'sh';
          // ---- plane versions
          {
            const c = m === 'sh' ? [Cc.x, Cc.y] : [0, 0], e = [E.x, E.y];
            const op = (u, w) => [u[0] + w[0] - c[0], u[1] + w[1] - c[1]];
            if (m === 'sh') { S.dot(0, 0, { r: 3.5, color: 'muted' }); S.tex('(0,0)', 0, 0, { dx: -24, dy: 12, size: 12, color: 'muted' }); }
            for (const t of TESTS) {
              const r = op(t, e);
              S.dot(t[0], t[1], { r: 4.5, color: 'teal' });
              if (Math.hypot(r[0] - t[0], r[1] - t[1]) > 0.02) arrow2(S, t, r, 'red', null, { width: 1.8, alpha: 0.75 });
              S.dot(r[0], r[1], { r: 3, color: 'red', alpha: 0.7 });
            }
            S.tex('v', TESTS[0][0], TESTS[0][1], { color: 'teal', dx: -12, dy: -10, size: 14 });
            S.tex('v\\oplus 0\'', ...op(TESTS[0], e), { color: 'red', dx: 0, dy: 16, size: 13 });
            S.dot(c[0], c[1], { r: 6, color: 'green' });
            if (m !== 'sh') S.tex('0', 0, 0, { dx: -10, dy: 12, size: 14, color: 'green' });
            else S.tex('0_V', c[0], c[1], { dx: 20, dy: 14, size: 14, color: 'green' });
            if (m !== 'pos') st = { m, e, z: c, op, ok: Math.hypot(e[0] - c[0], e[1] - c[1]) < 1e-9 };
          }
          // ---- (0,∞) as a log-scale line
          {
            NL.line(-3.2, 0, 3.2, 0, { color: 'muted', width: 1.4 });
            for (let k = -3; k <= 3; k++) { NL.line(k, -0.08, k, 0.08, { color: 'muted', width: 1 }); NL.text(k < 0 ? `1/${2 ** -k}` : String(2 ** k), k, -0.32, { align: 'center', size: 11.5, color: 'muted' }); }
            NL.line(0, -0.15, 0, 2.85, { color: 'green', width: 1.5, dash: [4, 4] });
            NL.text('the zero vector of this space is 1', 0.08, 2.75, { size: 11.5, color: 'green' });
            const e = EL.x;
            TL.forEach((t, k) => {
              const y = 0.85 + 0.65 * k, r = t + e;
              NL.dot(t, y, { r: 5, color: 'teal' });
              if (Math.abs(e) > 0.01) NL.arrow(t, y, r, y, { color: 'red', width: 1.8, head: 8 });
              NL.dot(r, y, { r: 3, color: 'red', alpha: 0.7 });
              NL.text(`v = ${fmtPos(2 ** t)}`, t, y + 0.22, { align: 'center', size: 11.5, color: 'teal' });
            });
            NL.text('log scale: x ⊕ y = xy is a shift by log y', -3.2, -0.62, { size: 11, color: 'muted' });
            if (m === 'pos') st = { m, e: 2 ** e, z: 1, ok: Math.abs(e) < 1e-12 };
          }
        });
        v.readout(() => {
          const s = st; if (!s.m) return '';
          const mark = (b) => (b ? '<span style="color:var(--c-green)">✓</span>' : '<span style="color:var(--c-red)">✗</span>');
          void mark;
          let val, e0, z0, last;
          if (s.m === 'pos') {
            val = (x) => fmtPos(x); e0 = val(s.e); z0 = '1';
            last = `$0' = ${e0}$, $\\;0'\\oplus 1 = ${val(s.e * 1)}$ (because $1$ is the identity), $\\;1\\oplus 0' = ${val(1 * s.e)}$ (commutativity), and the last link "$1\\oplus0' = 1$" — the hypothesis that $0'$ is an identity, tested on $v=1$ — `;
          } else {
            e0 = vtex(s.e); z0 = vtex(s.z);
            last = `$0' = ${e0}$, $\\;0'\\oplus 0 = ${vtex(s.op(s.e, s.z))}$ (because $0$ is the identity), $\\;0\\oplus 0' = ${vtex(s.op(s.z, s.e))}$ (commutativity), and the last link "$0\\oplus0' = 0$" — the hypothesis that $0'$ is an identity, tested on $v=0$ — `;
          }
          return last + (s.ok ? `**holds**: $0' = ${z0}$, the one and only additive identity.` : `**fails** (the zero vector is $${z0}$). So this $0'$ is no identity: it moves every $v$, as the red arrows show.`);
        });
      },
    },
    // ------------------------------------------------------------------ 1.27
    {
      num: '1.27',
      kind: 'Theorem',
      name: 'Unique additive inverse',
      statement: String.raw`Every element of a vector space has exactly one additive inverse: if $v\in V$ and $w,w'\in V$ satisfy $v+w=0$ and $v+w'=0$, then $w=w'$.`,
      idea: String.raw`Insert $0=v+w'$ next to $w$ and regroup:
$$w=w+0=w+(v+w')=(w+v)+w'=0+w'=w'.$$
The steps use the additive identity, the hypothesis $v+w'=0$, associativity (and commutativity, $w+v=v+w$), the hypothesis $v+w=0$, and the identity again. This uniqueness is what makes the notation $-v$ legitimate.`,
      caption: String.raw`Drag $v$ and two would-be inverses $w$, $w'$ (they snap onto $-v$). The gold path is the chain $w\to w+(v+w')\to(w+v)+w'=\dots\to w'$: its two links are the defects $v+w'$ and $-(v+w)$. While either candidate fails, the chain has a gap and $w\ne w'$ is possible; once both $v+w$ and $v+w'$ hit $0$, the chain collapses to a point and forces $w=w'$.`,
      deps: ['ladr-1.20'],
      tags: ['vector spaces'],
      viz(v) {
        const S = v.stage({ x: [-2.8, 2.8], y: [-2.2, 2.2], equal: true, height: 400, ticks: false });
        const V = S.handle(1.3, 0.8, { color: 'blue', label: 'v' });
        const snap = (x, y) => (Math.hypot(x + V.x, y + V.y) < 0.14 ? [-V.x, -V.y] : [x, y]);
        const W = S.handle(-1.6, -0.3, { color: 'orange', label: 'w', constrain: snap });
        const W2 = S.handle(-0.7, -1.4, { color: 'purple', label: 'w′', constrain: snap });
        v.legend([['blue', '$v$'], ['orange', '$w$ and $v+w$'], ['purple', "$w'$ and $v+w'$"], ['gold', "the chain from $w$ to $w'$"]]);
        let st = {};
        v.render(() => {
          const v0 = [V.x, V.y], w = [W.x, W.y], w2 = [W2.x, W2.y];
          const d1 = [v0[0] + w[0], v0[1] + w[1]], d2 = [v0[0] + w2[0], v0[1] + w2[1]];
          S.dot(-v0[0], -v0[1], { r: 9, color: 'green', alpha: 0.18 });
          S.tex('-v', -v0[0], -v0[1], { color: 'green', dx: 16, dy: 14, size: 13 });
          arrow2(S, [0, 0], v0, 'blue');
          arrow2(S, [0, 0], w, 'orange', null, { width: 2 }); arrow2(S, [0, 0], w2, 'purple', null, { width: 2 });
          // v + w and v + w′ tip to tail from the tip of v
          arrow2(S, v0, d1, 'orange', null, { width: 1.6, dash: [5, 4], alpha: 0.8 });
          arrow2(S, v0, d2, 'purple', null, { width: 1.6, dash: [5, 4], alpha: 0.8 });
          const z1 = Math.hypot(...d1) < 1e-9, z2 = Math.hypot(...d2) < 1e-9;
          S.dot(d1[0], d1[1], { r: 4.5, color: z1 ? 'green' : 'orange' }); S.dot(d2[0], d2[1], { r: 4.5, color: z2 ? 'green' : 'purple' });
          if (!z1) S.tex('v+w', d1[0], d1[1], { color: 'orange', dx: 22, dy: -10, size: 13 });
          if (!z2) S.tex("v+w'", d2[0], d2[1], { color: 'purple', dx: 24, dy: 10, size: 13 });
          // the chain w → w + (v + w′) → w′
          const mid = [w[0] + d2[0], w[1] + d2[1]];
          if (!z2) arrow2(S, w, mid, 'gold', null, { width: 3, alpha: 0.9 });
          if (Math.hypot(mid[0] - w2[0], mid[1] - w2[1]) > 1e-9) arrow2(S, mid, w2, 'gold', null, { width: 3, alpha: 0.9 });
          S.dot(mid[0], mid[1], { r: 4, color: 'gold' });
          S.dot(0, 0, { r: 4, color: 'ink' }); S.tex('0', 0, 0, { dx: -10, dy: 12, size: 13, color: 'muted' });
          S.corner(z1 && z2 ? "both are inverses ⇒ w = w′" : z1 || z2 ? 'only one candidate is an inverse' : 'neither candidate is an inverse yet', 'tl', { color: z1 && z2 ? 'green' : 'muted', weight: 600 });
          st = { v0, w, w2, d1, d2, mid, z1, z2 };
        });
        v.readout(() => {
          const { w, w2, d2, mid, z1, z2 } = st; if (!w) return '';
          const ok = (b) => (b ? '\\checkmark' : '\\times');
          return `$w = ${vtex(w)} \\overset{\\checkmark}{=} w+0 \\overset{${ok(z2)}}{=} w+(v+w') = ${vtex(mid)} \\overset{\\checkmark}{=} (w+v)+w' \\overset{${ok(z1)}}{=} 0+w' \\overset{\\checkmark}{=} w' = ${vtex(w2)}$. ` +
            (z1 && z2 ? 'Every link holds, so the two inverses coincide.' : `The marked links need $v+w'=0$ (now $${vtex(d2)}$) and $v+w=0$; as long as one fails, nothing forces $w=w'$.`);
        });
      },
    },
    // ------------------------------------------------------------------ 1.30
    {
      num: '1.30',
      kind: 'Theorem',
      name: 'The number 0 times a vector',
      statement: String.raw`In every vector space $V$, $0v=0$ for all $v\in V$. (On the left $0$ is the scalar $0\in\mathbf F$; on the right it is the zero vector of $V$.)`,
      idea: String.raw`By the distributive property, $0v=(0+0)v=0v+0v$. Adding the additive inverse of $0v$ to both sides leaves $0=0v$. The distributive law, which links the scalars to the vectors, is the only axiom that mentions both kinds of $0$, and it does all the work: in a structure where $(a+b)v=av+bv$ fails, $0v$ need not be the zero vector.`,
      caption: String.raw`Slide the scalar $a$ to $0$: in $\R^2$ every draggable $v$ shrinks along its line into the origin. In $(0,\infty)$ with $x\oplus y=xy$ and $a\odot x=x^a$, all points slide to $1$ — the zero vector there. With the twisted rule $a\cdot(x,y)=(ax,y)$ (not a vector space) the points stop on the vertical axis instead, and the readout shows the step $0v=0v+0v$ failing.`,
      deps: ['ladr-1.20'],
      tags: ['vector spaces'],
      viz(v) {
        const sp = v.select('', [{ value: 'R2', label: '$\\R^2$' }, { value: 'pos', label: '$(0,\\infty)$, $a\\odot x=x^a$' }, { value: 'tw', label: 'twisted $a\\cdot(x,y)=(ax,y)$' }], 'R2');
        const sa = v.slider('$a$', -1.5, 2, 0.45, { step: 0.01 });
        const S = v.stage({ x: [-3.2, 3.2], y: [-2.3, 2.3], equal: true, height: 400, ticks: false });
        const NL = v.stage({ x: [-3.4, 3.4], y: [-0.75, 3], height: 400, axes: false });
        const COLS = ['blue', 'orange', 'purple'];
        const H = [[1.5, 1.1], [-1.4, 0.9], [0.6, -1.3]].map((p, k) => S.handle(p[0], p[1], { color: COLS[k], label: `v${'₁₂₃'[k]}`, constrain: disc(1.9) }));
        const HL = [-1.6, 0.9, 1.9].map((x, k) => NL.handle(x, 0.85 + 0.75 * k, { color: COLS[k], constrain: (xx) => [v.M.clamp(xx, -2.2, 2.2), 0.85 + 0.75 * k] }));
        let st = {};
        v.render(() => {
          const m = sp.value, a = sa.value, tw = m === 'tw';
          show(S, m !== 'pos'); show(NL, m === 'pos');
          const mul = (t, p) => (tw ? [t * p[0], p[1]] : [t * p[0], t * p[1]]);
          // ---- plane
          H.forEach((h, k) => {
            const p = [h.x, h.y], q = mul(a, p), lo = mul(-1.5, p), hi = mul(2, p);
            S.line(lo[0], lo[1], hi[0], hi[1], { color: COLS[k], width: 1, alpha: 0.35 });
            arrow2(S, [0, 0], p, COLS[k], null, { width: 1.5, alpha: 0.3 });
            if (Math.hypot(...q) > 0.02) arrow2(S, [0, 0], q, COLS[k], null, { width: 2.8 });
            S.dot(q[0], q[1], { r: 4.5, color: COLS[k] });
            if (tw) { const z = mul(0, p); S.dot(z[0], z[1], { r: 3.5, color: 'red', hollow: true }); }
          });
          S.dot(0, 0, { r: 6, color: 'green', hollow: true, width: 2.2 });
          S.corner(Math.abs(a) < 1e-9 ? (tw ? '0·v stops on the vertical axis — not at 0' : 'a = 0: every av is the zero vector') : `a = ${v.fix(a, 2)}`, 'tl', { color: Math.abs(a) < 1e-9 ? (tw ? 'red' : 'green') : 'muted', weight: 600 });
          // ---- (0,∞) on a log scale
          NL.line(-3.3, 0, 3.3, 0, { color: 'muted', width: 1.4 });
          for (let k = -3; k <= 3; k++) { NL.line(k, -0.08, k, 0.08, { color: 'muted', width: 1 }); NL.text(k < 0 ? `1/${2 ** -k}` : String(2 ** k), k, -0.32, { align: 'center', size: 11.5, color: 'muted' }); }
          NL.line(0, -0.15, 0, 2.95, { color: 'green', width: 1.5, dash: [4, 4] });
          NL.text('zero vector = 1', 0.08, 2.85, { size: 11.5, color: 'green' });
          NL.text('log scale: a ⊙ x = xᵃ multiplies log x by a', -3.3, -0.62, { size: 11, color: 'muted' });
          HL.forEach((h, k) => {
            const y = h.y, q = a * h.x; // log₂(x^a) = a·log₂ x
            NL.line(-1.5 * h.x, y, 2 * h.x, y, { color: COLS[k], width: 1, alpha: 0.3 });
            if (Math.abs(q - h.x) > 0.02) NL.arrow(h.x, y, q, y, { color: COLS[k], width: 2, head: 8, alpha: 0.85 });
            NL.dot(q, y, { r: 4.5, color: COLS[k] });
            NL.text(`x = ${tn(2 ** h.x, 2)},  a⊙x = ${tn(2 ** q, 3)}`, -3.3, y + 0.28, { size: 11.5, color: COLS[k] });
          });
          st = { m, a, p: [H[0].x, H[0].y], x0: 2 ** HL[0].x };
        });
        v.readout(() => {
          const { m, a, p, x0 } = st; if (!m) return '';
          if (m === 'pos') return `Here $a\\odot x = x^a$, so $0\\odot x = x^0 = 1$ for every $x$ — and $1$ is the zero vector of this space (since $x\\oplus1 = x$). Check: $0\\odot x_1 = ${tn(x0, 2)}^0 = 1$, and $0\\odot x_1 \\oplus 0\\odot x_1 = 1\\cdot1 = 1$. Now $a = ${tn(a)}$.`;
          if (m === 'tw') return `Twisted rule: $0\\cdot v_1 = (0,\\ ${tn(p[1])})$ but $0\\cdot v_1 + 0\\cdot v_1 = (0,\\ ${tn(2 * p[1])})$, so already $(0+0)v_1 = 0v_1+0v_1$ fails — this rule breaks the distributive property $(a+b)v=av+bv$, and with it the theorem: $0\\cdot v_1 \\ne (0,0)$.`;
          return `$a v_1 = ${vtex([a * p[0], a * p[1]])}$. At $a=0$: $0v_1 = (0,0)$ and $0v_1+0v_1 = (0,0) = 0v_1$ — the equation $0v=0v+0v$ that, after adding $-0v$, forces $0v=0$ in every vector space.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.31
    {
      num: '1.31',
      kind: 'Theorem',
      name: 'A number times the vector 0',
      statement: String.raw`In every vector space $V$, $a0=0$ for all $a\in\mathbf F$ (here $0$ is the zero vector).`,
      idea: String.raw`By the distributive property, $a0=a(0+0)=a0+a0$; adding the additive inverse of $a0$ to both sides gives $0=a0$. This time it is the other distributive law, $a(u+w)=au+aw$, that does the work. Geometrically, multiplication by a scalar is a scaling of the whole space (a rotation-and-scaling when $\mathbf F=\C$) whose centre is the zero vector, so the zero vector is the one point that never moves.`,
      caption: String.raw`Pick the scalar $a$ on the left (on the real line for $\mathbf F=\R$, anywhere in the plane for $\mathbf F=\C$). On the right the whole grid and the letter F are multiplied by $a$; every point moves along its gold track except the zero vector. The last option scales about a point $c\neq0$ instead — a rule that breaks $a(u+w)=au+aw$ — and then $a\cdot0$ moves.`,
      deps: ['ladr-1.20'],
      tags: ['vector spaces'],
      viz(v) {
        const cx = v.cx;
        const sp = v.select('', [{ value: 'R', label: '$\\mathbf F=\\R$, $V=\\R^2$' }, { value: 'C', label: '$\\mathbf F=\\C$, $V=\\C^1$' }, { value: 'c', label: 'scaling about $c\\ne0$ (not a vector space)' }], 'C');
        const F = v.stage({ x: [-2.1, 2.1], y: [-2.1, 2.1], equal: true, height: 360, weight: 0.75, minWidth: 240, ticks: false, title: 'the scalar $a\\in\\mathbf F$' });
        const S = v.stage({ x: [-3.2, 3.2], y: [-2.4, 2.4], equal: true, height: 360, weight: 1.25, ticks: false, title: 'the vectors: $v\\mapsto av$' });
        const Ah = F.handle(0.75, 0.55, { color: 'purple', label: 'a', constrain: (x, y) => { const [u, w] = disc(1.9)(x, y); return sp.value === 'C' ? [u, w] : [u, 0]; } });
        const Cpt = [1.1, 0.7];
        const LETTER = [[0.6, -0.9], [0.6, 0.9], [1.6, 0.9], null, [0.6, 0.1], [1.3, 0.1]];
        let st = {};
        v.render(() => {
          const m = sp.value;
          if (m !== 'C' && Math.abs(Ah.y) > 1e-12) Ah.y = 0;
          const a = cx(Ah.x, Ah.y);
          const act = (p) => {
            if (m === 'c') return [Cpt[0] + a.re * (p[0] - Cpt[0]), Cpt[1] + a.re * (p[1] - Cpt[1])];
            const z = a.mul(cx(p[0], p[1])); return [z.re, z.im];
          };
          // scalar panel
          if (m === 'C') F.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 4] }); else F.line(-2.5, 0, 2.5, 0, { color: 'purple', width: 3, alpha: 0.25 });
          F.dot(1, 0, { r: 3, color: 'muted' }); F.tex('1', 1, 0, { dy: 13, size: 12, color: 'muted' });
          F.tex(m === 'C' ? `a = ${ctex(a)}` : `a = ${tn(a.re)}`, 0, 1.75, { color: 'purple', size: 15 });
          // vectors panel: original grid faint, image grid, tracks of lattice points
          for (let k = -3; k <= 3; k++) {
            S.line(k * 0.5 - 1.5 + 1.5, -1.5, k * 0.5, 1.5, { color: 'grid', width: 1 });
            S.line(-1.5, k * 0.5, 1.5, k * 0.5, { color: 'grid', width: 1 });
            const p1 = act([k * 0.5, -1.5]), p2 = act([k * 0.5, 1.5]), q1 = act([-1.5, k * 0.5]), q2 = act([1.5, k * 0.5]);
            S.line(p1[0], p1[1], p2[0], p2[1], { color: 'accent', width: 1, alpha: 0.45 }); S.line(q1[0], q1[1], q2[0], q2[1], { color: 'accent', width: 1, alpha: 0.45 });
          }
          for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
            const p = [i * 0.5, j * 0.5], q = act(p);
            if (Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.03) S.line(p[0], p[1], q[0], q[1], { color: 'gold', width: 1.2, alpha: 0.55 });
            S.dot(q[0], q[1], { r: 2.2, color: 'accent', ring: false });
          }
          S.path(LETTER, { color: 'muted', width: 2, alpha: 0.5 });
          S.path(LETTER.map((p) => p && act(p)), { color: 'blue', width: 3 });
          const z = act([0, 0]), moved = Math.hypot(...z) > 1e-9;
          if (m === 'c') { S.dot(Cpt[0], Cpt[1], { r: 5, color: 'red' }); S.tex('c', Cpt[0], Cpt[1], { color: 'red', dx: 12, dy: -10, size: 14 }); }
          if (moved) arrow2(S, [0, 0], z, 'red', 'a\\cdot 0', { width: 2.4 });
          S.dot(0, 0, { r: 6, color: moved ? 'red' : 'green' });
          S.tex('0', 0, 0, { dx: -11, dy: 13, size: 14, color: moved ? 'red' : 'green' });
          st = { m, a, z, moved };
        });
        v.readout(() => {
          const { m, a, z, moved } = st; if (!m) return '';
          if (m === 'c') return `Scaling about $c$: $a\\cdot v = c + a(v-c)$, so $a\\cdot0 = (1-a)c = ${vtex(z)}$` + (moved ? ' $\\ne 0$' : '') + `. This rule fails $a\\cdot(u+w) = a\\cdot u + a\\cdot w$ (the left side contains $c$ once, the right side twice), so it is not a vector space and the theorem does not apply. Only $a=1$ leaves $0$ in place.`;
          const as = m === 'C' ? ctex(a) : tn(a.re);
          return `$a = ${as}$: $\\;a\\cdot0 = ${m === 'C' ? '0' : '(0,0)'}$ and $a0 + a0 = a0$ — the equation $a0 = a(0+0) = a0+a0$ from the proof. Every other point moves (unless $a=1$); the zero vector is the fixed centre of every scaling` + (m === 'C' ? ' and rotation.' : '.');
        });
      },
    },
  ],
};
