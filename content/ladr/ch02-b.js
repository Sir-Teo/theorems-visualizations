// Linear Algebra Done Right — Chapter 2: Finite-Dimensional Vector Spaces
// Part 2 (2.30–2.43): reducing and extending to bases, complements, dimension and dimension counting.
// Part 1 is ch02.js (2.4–2.28); the helper block below is shared verbatim with it.

// =====================================================================================================
// Shared helpers. A small 3D scene drawn on a 2D stage, so that vectors in R^3 can be dragged by their
// tips (dragging moves a tip parallel to the screen; dragging the background rotates the view).
// =====================================================================================================
const VC = ['blue', 'purple', 'teal', 'pink', 'orange']; // colours of v_1, v_2, … in every picture
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const unit3 = (a) => { const l = len3(a); return l > 1e-12 ? mul3(a, 1 / l) : [0, 0, 0]; };
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const comb = (cs, vs) => cs.reduce((s, c, i) => add3(s, mul3(vs[i], c)), [0, 0, 0]);
const det3 = (a, b, c) => dot3(a, cross(b, c));
const ZERO = [0, 0, 0];
/** Orthonormal basis of span(vs) (Gram–Schmidt, twice); vectors already in the span are skipped. */
function orth(vs, tol = 1e-7) {
  const B = [];
  for (const x of vs) {
    let w = x.slice();
    for (let pass = 0; pass < 2; pass++) for (const e of B) w = sub3(w, mul3(e, dot3(w, e)));
    const l = len3(w); if (l > tol * Math.max(1, len3(x))) B.push(mul3(w, 1 / l));
  }
  return B;
}
const projOnto = (x, B) => B.reduce((s, e) => add3(s, mul3(e, dot3(x, e))), [0, 0, 0]);
const distTo = (x, B) => len3(sub3(x, projOnto(x, B)));
/** Move x onto span(B) (B orthonormal) when it is within tol of it — the "snap into the span". */
const snapInto = (x, B, tol) => (B.length && B.length < 3 && distTo(x, B) < tol ? projOnto(x, B) : x);
/** Keep a dragged point inside span(B): slide it along the view direction f onto a plane, project onto a line. */
function intoSpan(q, B, f) {
  if (B.length >= 3) return q;
  if (!B.length) return ZERO.slice();
  if (B.length === 1) return mul3(B[0], dot3(q, B[0]));
  const n = cross(B[0], B[1]), d = dot3(n, f);
  return Math.abs(d) > 0.15 ? sub3(q, mul3(f, dot3(n, q) / d)) : sub3(q, mul3(n, dot3(n, q)));
}
/** Coefficients c with Σ c_k vs_k = x (least squares, minimum norm when vs is dependent). */
function coords(M, vs, x) { if (!vs.length) return []; return M.lstsq([0, 1, 2].map((i) => vs.map((w) => w[i])), x); }
/** Linear dependence lemma: the first k with vs[k] ∈ span(vs[0..k−1]), with its coefficients; null if independent. */
function firstDependent(M, vs, tol = 1e-6) {
  for (let k = 0; k < vs.length; k++) {
    if (distTo(vs[k], orth(vs.slice(0, k))) <= tol * Math.max(1, len3(vs[k]))) return { k, c: coords(M, vs.slice(0, k), vs[k]) };
  }
  return null;
}
/** Indices kept by sifting (2.30): drop every vector lying in the span of the ones kept before it. */
function siftIdx(vs, tol = 1e-6) {
  const kept = [];
  vs.forEach((x, i) => { if (distTo(x, orth(kept.map((j) => vs[j]))) > tol * Math.max(1, len3(x))) kept.push(i); });
  return kept;
}
const tn = (x, d = 2) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
/** TeX for Σ c_k names_k, skipping zero terms. */
function combTeX(cs, names, d = 2) {
  let s = '';
  cs.forEach((c, i) => {
    if (Math.abs(c) < 0.5 * 10 ** -d) return;
    const a = Math.abs(c).toFixed(d), co = a === (1).toFixed(d) ? '' : a + '\\,';
    s += (s ? (c < 0 ? ' - ' : ' + ') : c < 0 ? '-' : '') + co + names[i];
  });
  return s || '0';
}
const vecTeX = (p, d = 2) => `(${p.map((x) => tn(x, d)).join(',\\,')})`;
function inConvex(p, poly) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const c = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    if (Math.abs(c) < 1e-12) continue;
    const g = c > 0 ? 1 : -1; if (!s) s = g; else if (g !== s) return false;
  }
  return true;
}
/**
 * scene3(v, opts) → G: an orthographic 3D view on a 2D stage.
 * G.handle(p, {color, constrain(q, f)}) makes a draggable tip (read h.p); the background rotates the view.
 * Inside G.render(fn): G.line/arrow/vec/dot/poly/disc/lattice/lineSpan/cube/text/tex. Filled faces are drawn first
 * (far to near) and act as tinted glass: whatever lies behind one is drawn fainter (more so for denser faces).
 */
function scene3(v, o = {}) {
  const R = o.range ?? 2.3;
  const S = v.stage({ x: [-R, R], y: [-R, R], equal: true, axes: false, height: o.height ?? 380, title: o.title, weight: o.weight ?? 1, minWidth: o.minWidth ?? 280, full: o.full });
  const G = { S, yaw: o.yaw ?? -0.62, pitch: o.pitch ?? 0.36, ball: o.ball ?? 2.0, handles: [] };
  let rt = [1, 0, 0], up = [0, 0, 1], fw = [0, 1, 0], items = [], faces = [], occ = [];
  const frame = () => {
    const cy = Math.cos(G.yaw), sy = Math.sin(G.yaw), cp = Math.cos(G.pitch), sp = Math.sin(G.pitch);
    rt = [cy, -sy, 0]; up = [sp * sy, sp * cy, cp]; fw = [cp * sy, cp * cy, -sp];
  };
  frame();
  G.P = (p) => [dot3(p, rt), dot3(p, up)];
  G.depth = (p) => dot3(p, fw);
  G.view = () => fw.slice();
  let d0 = null;
  S.onDrag((x, y, ph) => {
    if (ph === 'start') { d0 = [x, y, G.yaw, G.pitch]; return; }
    if (!d0) return;
    const k = S.scale * 0.009;
    G.yaw = d0[2] - (x - d0[0]) * k; G.pitch = Math.max(-1.45, Math.min(1.45, d0[3] - (y - d0[1]) * k));
    if (ph === 'end') d0 = null;
  });
  G.handle = (p0, st = {}) => {
    const H = { p: p0.slice(), color: st.color || 'accent' };
    H.hd = S.handle(0, 0, {
      color: H.color, r: st.r ?? 6.5,
      constrain: (x, y) => {
        const [px, py] = G.P(H.p);
        let q = add3(H.p, add3(mul3(rt, x - px), mul3(up, y - py)));
        const L = len3(q); if (L > G.ball) q = mul3(q, G.ball / L);
        if (st.constrain) q = st.constrain(q, fw) || q;
        H.p = q; st.onDrag?.(H);
        return G.P(q);
      },
    });
    Object.defineProperty(H, 'visible', { get: () => H.hd.visible !== false, set: (b) => { H.hd.visible = b; } });
    H.set = (p) => { H.p = p.slice(); v.invalidate(); };
    G.handles.push(H); return H;
  };
  // ---- occlusion: the fraction of q that shows through the filled faces between q and the viewer
  const seen = (q) => {
    let f = 1;
    for (const O of occ) {
      const den = -dot3(O.n, fw); if (Math.abs(den) < 1e-4) continue;
      const t = dot3(O.n, sub3(O.c, q)) / den; if (t <= 0.03) continue;
      const d = sub3(add3(q, mul3(fw, -t)), O.c);
      if (inConvex([dot3(d, O.e1), dot3(d, O.e2)], O.poly)) f *= O.k;
    }
    return f;
  };
  const drawLine = (p, q, st) => {
    const L = len3(sub3(q, p)); if (L < 1e-9) return;
    const n = st.n ?? Math.max(1, Math.min(48, Math.ceil(L / 0.1)));
    const base = st.alpha ?? 1, col = st.color || 'ink', w = st.width ?? 2;
    if (st.fade) {
      for (let i = 0; i < n; i++) {
        const s = Math.abs(((i + 0.5) / n) * 2 - 1), fa = Math.min(1, (1 - s) / 0.4);
        S.path([G.P(lerp3(p, q, i / n)), G.P(lerp3(p, q, (i + 1) / n))], { color: col, width: w, alpha: base * fa * seen(lerp3(p, q, (i + 0.5) / n)), cap: 'butt' });
      }
      return;
    }
    let run = [G.P(p)], k = seen(lerp3(p, q, 0.5 / n));
    for (let i = 1; i <= n; i++) {
      const kn = i < n ? seen(lerp3(p, q, (i + 0.5) / n)) : null;
      run.push(G.P(lerp3(p, q, i / n)));
      if (i === n || kn !== k) { S.path(run, { color: col, width: w, alpha: base * k, dash: st.dash }); run = [run[run.length - 1]]; k = kn; }
    }
  };
  G.line = (p, q, st = {}) => { items.push(() => drawLine(p, q, st)); return G; };
  G.path = (pts, st = {}) => { for (let i = 0; i + 1 < pts.length; i++) G.line(pts[i], pts[i + 1], st); return G; };
  G.arrow = (p, q, st = {}) => {
    items.push(() => {
      const A = G.P(p), B = G.P(q), sc = S.scale, Lpx = Math.hypot(B[0] - A[0], B[1] - A[1]) * sc;
      const hs = Math.min(st.head ?? 10, Lpx * 0.45);
      drawLine(p, Lpx > 1 ? lerp3(p, q, 1 - (hs * 0.8) / Lpx) : q, st);
      if (Lpx < 1 || hs <= 0) return;
      const ux = ((B[0] - A[0]) * sc) / Lpx, uy = ((B[1] - A[1]) * sc) / Lpx, h = hs / sc;
      const al = (st.alpha ?? 1) * seen(q);
      S.poly([B, [B[0] - ux * h - uy * h * 0.45, B[1] - uy * h + ux * h * 0.45], [B[0] - ux * h + uy * h * 0.45, B[1] - uy * h - ux * h * 0.45]], { fill: st.color || 'ink', fillAlpha: al, stroke: false });
    });
    return G;
  };
  /** Arrow from st.from (default 0) to p with a TeX label just beyond the tip. */
  G.vec = (p, st = {}) => {
    const from = st.from || ZERO;
    G.arrow(from, p, st);
    if (st.label) {
      const A = G.P(from), B = G.P(p); let dx = B[0] - A[0], dy = B[1] - A[1]; const L = Math.hypot(dx, dy);
      if (L * S.scale < 8) { dx = 0.7; dy = 0.7; } else { dx /= L; dy /= L; }
      const off = st.off ?? 15, at = st.at ?? 1, X = A[0] + (B[0] - A[0]) * at, Y = A[1] + (B[1] - A[1]) * at;
      if (at < 1) [dx, dy] = [-dy, dx]; // mid-arrow labels sit beside the arrow
      S.tex(st.label, X, Y, { color: st.labelColor || st.color || 'ink', dx: dx * off + (st.dx || 0), dy: -dy * off + (st.dy || 0), size: st.size ?? 15 });
    }
    return G;
  };
  G.dot = (p, st = {}) => { items.push(() => { const [x, y] = G.P(p); S.dot(x, y, { ...st, alpha: (st.alpha ?? 1) * (st.noDim ? 1 : seen(p)) }); }); return G; };
  G.text = (str, p, st = {}) => { items.push(() => { const [x, y] = G.P(p); S.text(str, x, y, st); }); return G; };
  G.tex = (latex, p, st = {}) => { const [x, y] = G.P(p); S.tex(latex, x, y, st); return G; };
  /** Queue a status line in a corner, or any pixel drawing, to be painted on top of the scene. */
  G.corner = (text, pos = 'tl', st = {}) => { items.push(() => S.corner(text, pos, st)); return G; };
  G.overlay = (f) => { items.push(f); return G; };
  /** Filled planar polygon; it also tints whatever lies behind it (unless occlude: false). */
  G.poly = (pts, st = {}) => {
    const c = mul3(pts.reduce((s, p) => add3(s, p), [0, 0, 0]), 1 / pts.length);
    const fa = st.fillAlpha ?? 0.14;
    faces.push({ pts, depth: G.depth(c), st: { fill: st.fill ?? st.color ?? 'accent', fillAlpha: fa, color: st.stroke === false ? undefined : st.color ?? st.fill ?? 'accent', width: st.width ?? 1, alpha: st.alpha ?? 0.5, stroke: st.stroke } });
    if (st.occlude !== false && pts.length >= 3) {
      let nrm = [0, 0, 0];
      for (let i = 1; i + 1 < pts.length; i++) nrm = add3(nrm, cross(sub3(pts[i], pts[0]), sub3(pts[i + 1], pts[0])));
      const e1 = unit3(sub3(pts[1], pts[0]));
      if (len3(nrm) > 1e-6 && len3(e1) > 0) {
        const n = unit3(nrm), e2 = cross(n, e1);
        occ.push({ n, c: pts[0], e1, e2, k: Math.max(0.3, Math.min(0.95, 1 - 3.4 * fa)), poly: pts.map((p) => { const d = sub3(p, pts[0]); return [dot3(d, e1), dot3(d, e2)]; }) });
      }
    }
    return G;
  };
  /** Disc of radius r in the plane with orthonormal basis B (a plane through c, default 0). */
  G.disc = (B, st = {}) => {
    const r = st.r ?? 2, c = st.c || ZERO, pts = [];
    for (let i = 0; i < 60; i++) { const t = (2 * Math.PI * i) / 60; pts.push(add3(c, add3(mul3(B[0], r * Math.cos(t)), mul3(B[1], r * Math.sin(t))))); }
    return G.poly(pts, { fillAlpha: 0.13, alpha: 0.45, ...st });
  };
  /** The lines {j b1 + s b2} and {s b1 + j b2} (j integer) inside the disc of radius r in span(b1, b2). */
  G.lattice = (b1, b2, r, st = {}) => {
    const E = orth([b1, b2]); if (E.length < 2) return G;
    const loc = (b) => [dot3(b, E[0]), dot3(b, E[1])];
    for (const [P, Q] of [[b1, b2], [b2, b1]]) {
      const p = loc(P), q = loc(Q), qq = q[0] ** 2 + q[1] ** 2, pq = p[0] * q[0] + p[1] * q[1], pp = p[0] ** 2 + p[1] ** 2;
      const gap = Math.abs(p[0] * q[1] - p[1] * q[0]) / Math.sqrt(qq); if (gap < 0.12) continue;
      for (let j = -Math.floor(r / gap); j <= Math.floor(r / gap); j++) {
        const disc = (j * pq) ** 2 - qq * (j * j * pp - r * r); if (disc <= 0) continue;
        const s0 = (-j * pq - Math.sqrt(disc)) / qq, s1 = (-j * pq + Math.sqrt(disc)) / qq;
        G.line(add3(mul3(P, j), mul3(Q, s0)), add3(mul3(P, j), mul3(Q, s1)), { color: st.color || 'accent', width: j === 0 ? 1.4 : 1, alpha: (st.alpha ?? 0.3) * (j === 0 ? 1.6 : 1) });
      }
    }
    return G;
  };
  /** The line R·d through 0, fading out at both ends. */
  G.lineSpan = (d, st = {}) => { const u = unit3(d), L = st.len ?? 2.3; return G.line(mul3(u, -L), mul3(u, L), { fade: true, width: 4, alpha: 0.5, ...st }); };
  /** A lightly tinted cube [−h, h]³, standing for "all of R³" (it does not dim what is inside). */
  G.cube = (h, st = {}) => {
    const V = (i, j, k) => [i * h, j * h, k * h];
    for (const s of [-1, 1]) {
      G.poly([V(s, -1, -1), V(s, 1, -1), V(s, 1, 1), V(s, -1, 1)], { fillAlpha: 0.035, alpha: 0.4, occlude: false, ...st });
      G.poly([V(-1, s, -1), V(1, s, -1), V(1, s, 1), V(-1, s, 1)], { fillAlpha: 0.035, alpha: 0.4, occlude: false, ...st });
      G.poly([V(-1, -1, s), V(1, -1, s), V(1, 1, s), V(-1, 1, s)], { fillAlpha: 0.035, alpha: 0.4, occlude: false, ...st });
    }
    return G;
  };
  /** Draw a subspace given by an orthonormal basis B: {0}, a line, a disc, or a cube. */
  G.subspace = (B, st = {}) => {
    if (B.length === 0) return G.dot(ZERO, { r: 6, color: st.color || 'accent', noDim: true });
    if (B.length === 1) return G.lineSpan(B[0], { color: st.color || 'accent', ...st });
    if (B.length === 2) return G.disc(B, { color: st.color || 'accent', r: st.r ?? 2, ...st });
    return G.cube(st.h ?? 1.6, { color: st.color || 'accent' });
  };
  G.axes = () => {
    const L = o.axisLen ?? 2.2, lab = G.labels ?? o.labels ?? ['x', 'y', 'z'];
    for (let i = 0; i < 3; i++) {
      const e = [0, 0, 0]; e[i] = 1;
      G.line(mul3(e, -L), mul3(e, L), { color: 'faint', width: 1, n: 16 });
      G.text(lab[i], mul3(e, L * 1.09), { color: 'muted', math: true, align: 'center', size: 15 });
    }
  };
  G.render = (fn) => {
    v.render((t) => {
      frame(); items = []; faces = []; occ = [];
      if (o.axes !== false) G.axes();
      fn(t);
      for (const H of G.handles) { const [x, y] = G.P(H.p); H.hd.x = x; H.hd.y = y; }
      faces.sort((a, b) => b.depth - a.depth);
      for (const F of faces) S.poly(F.pts.map(G.P), F.st);
      for (const f of items) f();
      if (o.hint !== false) S.corner('drag the background to rotate', 'br', { color: 'faint', size: 10.5 });
    });
  };
  return G;
}
/** The six faces of the parallelepiped spanned by a, b, c. */
function parallelepiped(G, a, b, c, st = {}) {
  const O = ZERO, ab = add3(a, b), ac = add3(a, c), bc = add3(b, c), abc = add3(ab, c);
  for (const f of [[O, a, ab, b], [c, ac, abc, bc], [O, a, ac, c], [b, ab, abc, bc], [O, b, bc, c], [a, ab, abc, ac]]) G.poly(f, { fillAlpha: 0.1, alpha: 0.55, ...st });
}
/** A row of labelled chips at pixel (x, y) on stage S; items {t, color, state: 'on'|'off'|'hot'|'gone'|'new'}. */
function chips(v, S, items, x, y) {
  const c = S.ctx; c.save(); c.font = 'italic 15px Newsreader, "Times New Roman", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  let X = x;
  for (const it of items) {
    const w = Math.max(30, c.measureText(it.t).width + 16), h = 23, col = it.color || 'ink';
    c.beginPath(); if (c.roundRect) c.roundRect(X, y, w, h, 7); else c.rect(X, y, w, h);
    const st = it.state || 'on';
    c.fillStyle = st === 'gone' ? v.color('faint', 0.12) : st === 'off' ? v.color('panel', 0.9) : v.color(col, st === 'hot' || st === 'new' ? 0.26 : 0.14);
    c.fill();
    c.lineWidth = st === 'hot' || st === 'new' ? 2.2 : 1.2;
    c.strokeStyle = st === 'hot' ? v.color('red') : st === 'new' ? v.color('gold') : v.color(st === 'gone' ? 'faint' : col, st === 'off' ? 0.5 : 0.9);
    c.stroke();
    c.fillStyle = v.color(st === 'gone' ? 'faint' : st === 'off' ? 'muted' : 'ink');
    c.fillText(it.t, X + w / 2, y + h / 2 + 1);
    if (st === 'gone') { c.beginPath(); c.moveTo(X + 5, y + h / 2); c.lineTo(X + w - 5, y + h / 2); c.strokeStyle = v.color('red', 0.8); c.lineWidth = 1.6; c.stroke(); }
    X += w + 6;
  }
  c.restore();
}
const SUB = ['₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
/** Draw p→q in a 2D stage with a TeX label just beyond the tip. */
function vec2(S, p, q, color, label, o = {}) {
  S.arrow(p[0], p[1], q[0], q[1], { color, width: o.width ?? 2.6, head: o.head ?? 10, dash: o.dash, alpha: o.alpha });
  if (label) {
    const dx = (q[0] - p[0]) * S.scale, dy = (q[1] - p[1]) * S.scale, L = Math.hypot(dx, dy);
    const off = o.off ?? 15, ux = L > 6 ? dx / L : 0.7, uy = L > 6 ? dy / L : 0.7;
    S.tex(label, q[0], q[1], { color, size: o.size ?? 15, dx: ux * off + (o.dx || 0), dy: -uy * off + (o.dy || 0), alpha: o.labelAlpha });
  }
}
/** Snap a 2D point onto the line R·w when it is within tol of it. */
function snapLine2(p, w, tol) {
  const L = Math.hypot(w[0], w[1]); if (L < 1e-9) return p;
  const u = [w[0] / L, w[1] / L], t = p[0] * u[0] + p[1] * u[1];
  return Math.abs(p[0] * u[1] - p[1] * u[0]) < tol ? [t * u[0], t * u[1]] : p;
}
const det2 = (p, q) => p[0] * q[1] - p[1] * q[0];
/** Snap each coordinate to a multiple of step when it is within tol of one. */
const snapGrid = (q, step = 0.5, tol = 0.09) => q.map((c) => { const r = Math.round(c / step) * step; return Math.abs(c - r) < tol ? r : c; });
const to3 = (p) => [p[0], p[1], 0];

export default {
  collection: 'ladr',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.30
    {
      num: '2.30',
      kind: 'Theorem',
      name: 'Every spanning list contains a basis',
      statement: String.raw`Every spanning list in a vector space can be reduced to a basis of the vector space.`,
      idea: String.raw`Run through the spanning list $v_1,\dots,v_n$ from left to right and delete $v_k$ whenever it lies in the span of the vectors kept before it (for $k=1$: whenever $v_1=0$). A deleted vector was a combination of kept ones, so by the linear dependence lemma 2.19 deleting it leaves the span unchanged, and the final list still spans. No kept vector lies in the span of its predecessors, so by 2.19 again the final list is linearly independent — a basis (2.26).`,
      caption: String.raw`Five vectors span $\mathbf R^2$. Drag them (a tip snaps onto the line of an earlier vector, and to $0$ near the origin) and step through the sifting: each $v_k$ is tested against the span of the vectors kept so far (shaded); it is struck out if it already lies there, and the gold path shows how it is a combination of the kept ones. Whatever the start, exactly two vectors survive, and they form a basis.`,
      deps: ['ladr-2.19', 'ladr-2.26'],
      tags: ['bases'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-3.3, 3.3], y: [-2.3, 2.3], equal: true, height: 380, minWidth: 340 });
        const H = [];
        [[0.9, 0.45], [1.8, 0.9], [-0.5, 1.3], [1.4, -1.0], [-1.5, -0.55]].forEach((p, i) => H.push(S.handle(p[0], p[1], {
          color: VC[i],
          constrain: (x, y) => {
            if (Math.hypot(x, y) < 0.15) return [0, 0];
            for (let j = 0; j < 5; j++) if (j !== i) { const s = snapLine2([x, y], [H[j].x, H[j].y], 0.13); if (s[0] !== x || s[1] !== y) return s; }
            return [x, y];
          },
        })));
        const CODE = [
          '$B \\leftarrow (v_1,\\dots,v_n)$   ▷ spans $V$',
          'for $k = 1$ to $n$:',
          '  if $v_k \\in \\operatorname{span}(\\text{vectors kept so far})$:',
          '    delete $v_k$   ▷ span unchanged (2.19)',
          '  else: keep $v_k$',
          'return $B$   ▷ spans, and is independent (2.19)',
        ];
        const names = ['v_1', 'v_2', 'v_3', 'v_4', 'v_5'];
        function build() {
          const vs = H.map((h) => to3([h.x, h.y])), kept = [], del = [];
          const F = [{ k: -1, kept: [], del: [], line: 1, note: 'Start with the spanning list $v_1,\\dots,v_5$ of $\\mathbf R^2$.' }];
          for (let k = 0; k < 5; k++) {
            const before = kept.slice(), B = orth(before.map((j) => vs[j]));
            const inSp = distTo(vs[k], B) <= 1e-6 * Math.max(1, len3(vs[k]));
            const c = inSp && before.length ? coords(M, before.map((j) => vs[j]), vs[k]) : null;
            if (inSp) del.push(k); else kept.push(k);
            const span = ['$\\{0\\}$', `the line $\\operatorname{span}(${before.map((j) => names[j]).join(',')})$`, 'all of $\\mathbf R^2$'][B.length];
            const note = inSp
              ? (k === 0 || !before.length ? `$v_1 = 0$ lies in $\\operatorname{span}(\\,) = \\{0\\}$: delete it.` : `$v_${k + 1} = ${combTeX(c, before.map((j) => names[j]))}$ lies in ${span}: delete it — the span does not change.`)
              : `$v_${k + 1}$ is not in ${span}: keep it.`;
            F.push({ k, before, kept: kept.slice(), del: del.slice(), inSp, c, line: inSp ? 4 : 5, note });
          }
          F.push({ k: 5, before: kept.slice(), kept: kept.slice(), del: del.slice(), done: true, line: 6, hold: 2, note: `What is left, $${kept.map((j) => names[j]).join(',')}$, still spans $\\mathbf R^2$ and no vector lies in the span of its predecessors: it is a basis.` });
          return F;
        }
        const ST = v.steps({ frames: build, code: CODE, codeTitle: 'Reduce to a basis (proof of 2.30)', speed: 0.9, start: 2 });
        let sig = '', st = null;
        v.legend([['accent', 'span of the vectors kept so far', { area: true }], ['gold', 'the deleted vector as a combination of kept ones', { dash: true }]]);
        v.render(() => {
          const s = H.map((h) => `${h.x.toFixed(4)},${h.y.toFixed(4)}`).join('|');
          if (s !== sig) { const first = !sig; sig = s; if (!first) ST.reset(undefined, { at: 'keep' }); }
          const f = ST.frame; if (!f.kept) return;
          const vs = H.map((h) => [h.x, h.y]), B = orth(f.before.map((j) => to3(vs[j])));
          if (B.length === 2) S.rect(-9, -9, 9, 9, { fill: 'accent', fillAlpha: f.done ? 0.05 : 0.08, stroke: false });
          else if (B.length === 1) S.line(-8 * B[0][0], -8 * B[0][1], 8 * B[0][0], 8 * B[0][1], { color: 'accent', width: 9, alpha: 0.22 });
          if (f.done && f.kept.length === 2) { const [a, b] = f.kept.map((j) => vs[j]); S.poly([[0, 0], a, [a[0] + b[0], a[1] + b[1]], b], { fill: 'green', fillAlpha: 0.16, color: 'green', width: 1.2, alpha: 0.6 }); }
          if (f.c) { let p = [0, 0]; f.c.forEach((c, i) => { const w = vs[f.before[i]], n = [p[0] + c * w[0], p[1] + c * w[1]]; S.arrow(p[0], p[1], n[0], n[1], { color: 'gold', width: 2.2, dash: [6, 4], head: 9 }); p = n; }); }
          vs.forEach((p, i) => {
            const gone = f.del.includes(i) && i !== f.k, pending = i > f.k && !f.done, cur = i === f.k;
            if (gone) vec2(S, [0, 0], p, 'faint', names[i], { width: 1.6, dash: [4, 4], head: 7 });
            else vec2(S, [0, 0], p, VC[i], names[i], { width: cur ? 3.4 : 2.6, alpha: pending ? 0.35 : 1, labelAlpha: pending ? 0.45 : 1 });
          });
          if (f.k >= 0 && f.k < 5) S.dot(vs[f.k][0], vs[f.k][1], { r: 12, hollow: true, color: f.inSp ? 'red' : 'green', width: 2.6 });
          S.dot(0, 0, { r: 3, color: 'ink' });
          chips(v, S, names.map((n, i) => ({ t: `v${SUB[i]}`, color: VC[i], state: i === f.k ? (f.inSp ? 'hot' : 'new') : f.del.includes(i) ? 'gone' : i > f.k && !f.done ? 'off' : 'on' })), 10, 8);
          st = f;
        });
        v.readout(() => {
          const f = st; if (!f) return '';
          return `Kept so far: $${f.kept.length ? f.kept.map((j) => names[j]).join(',') : '(\\,)'}$; deleted: $${f.del.length ? f.del.map((j) => names[j]).join(',') : '\\text{none}'}$.` + (f.done ? ` The survivors form a basis of length ${f.kept.length}.` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 2.31
    {
      num: '2.31',
      kind: 'Corollary',
      name: 'Basis of finite-dimensional vector space',
      statement: String.raw`Every finite-dimensional vector space has a basis.`,
      idea: String.raw`By definition 2.9 a finite-dimensional space has a spanning list, and by 2.30 every spanning list can be reduced to a basis. (For $V=\{0\}$ the reduction deletes every vector and leaves the empty list, which is a basis of $\{0\}$.)`,
      caption: String.raw`Choose a space, and press *Resample* for a new messy spanning list of it — repeats, multiples, sums, even $0$. Switch on *reduce* to run the procedure of 2.30: the struck-out vectors were combinations of earlier ones, the green survivors form a basis. Whatever the list, the survivors number $1$ for a line, $2$ for a plane, $3$ for $\mathbf R^3$ and $0$ for $\{0\}$.`,
      deps: ['ladr-2.30', 'ladr-2.9'],
      tags: ['bases'],
      viz(v) {
        const M = v.M;
        const G = scene3(v, { height: 400 });
        const sp = v.select('space', [{ value: '0', label: '$\\{0\\}$' }, { value: '1', label: 'a line' }, { value: '2', label: 'a plane' }, { value: '3', label: '$\\mathbf R^3$' }], '2');
        const red = v.toggle('reduce to a basis', true);
        let seed = 7;
        v.button('Resample', () => { seed++; });
        const UB = { 0: [], 1: orth([[0.8, -0.35, 0.5]]), 2: orth([[1, 0, -0.8], [0, 1, -0.4]]), 3: orth([[1, 0, 0], [0, 1, 0], [0, 0, 1]]) };
        function messy(U, sd) {
          const r = v.rng(sd), L = [], why = [];
          const rand = () => { for (let t = 0; t < 99; t++) { const p = comb(U.map(() => r.uniform(-1.5, 1.5)), U); if (len3(p) > 0.75 && len3(p) < 1.8) return p; } return comb(U.map(() => 1), U); };
          if (!U.length) return { L: [ZERO, ZERO, ZERO], why: ['0', '0', '0'] };
          const plan = ['r'];
          const rest = ['r', 'r', 'm', 's', 'z', r() < 0.5 ? 'm' : 'r'];
          for (let i = 0; i < U.length - 1; i++) rest[i] = 'r';
          r.shuffle(rest); plan.push(...rest);
          if (plan.indexOf('s') > -1 && plan.indexOf('s') < 2) { const i = plan.indexOf('s'); [plan[i], plan[5]] = [plan[5], plan[i]]; }
          for (const t of plan) {
            if (t === 'z') { L.push(ZERO.slice()); why.push('0'); }
            else if (t === 'm' && L.some((x) => len3(x) > 0)) { const cands = L.map((x, i) => i).filter((i) => len3(L[i]) > 0); const i = cands[r.int(0, cands.length - 1)], k = r.pick([-1, -0.6, 0.5, 1.4]); L.push(mul3(L[i], k)); why.push(`${k}·v${SUB[i]}`); }
            else if (t === 's' && L.filter((x) => len3(x) > 0).length >= 2) { const cands = L.map((x, i) => i).filter((i) => len3(L[i]) > 0); const i = cands[0], j = cands[cands.length - 1]; const p = add3(mul3(L[i], 0.6), mul3(L[j], 0.7)); L.push(p); why.push(`0.6·v${SUB[i]} + 0.7·v${SUB[j]}`); }
            else { L.push(rand()); why.push('new'); }
          }
          return { L, why };
        }
        let st = null;
        v.legend([['orange', 'the space $V$', { area: true }], ['blue', 'the spanning list'], ['green', 'survivors: a basis of $V$'], ['faint', 'struck out', { dash: true }]]);
        G.render(() => {
          const U = UB[sp.value], { L } = messy(U, seed * 31 + +sp.value), kept = siftIdx(L), R = red.value;
          if (U.length === 3) G.cube(1.6, { color: 'orange' }); else if (U.length === 2) G.disc(U, { color: 'orange', r: 2.05, fillAlpha: 0.1 }); else if (U.length === 1) G.lineSpan(U[0], { color: 'orange', width: 3, len: 2.2 });
          if (R && kept.length === 3) parallelepiped(G, L[kept[0]], L[kept[1]], L[kept[2]], { color: 'green', fillAlpha: 0.06, alpha: 0.35 });
          if (R && kept.length === 2) { const [a, b] = kept.map((i) => L[i]); G.poly([ZERO, a, add3(a, b), b], { fill: 'green', fillAlpha: 0.14, color: 'green', alpha: 0.5, occlude: false }); }
          L.forEach((p, i) => {
            const k = kept.includes(i), lab = `v_${i + 1}`;
            if (len3(p) < 1e-9) { G.dot(ZERO, { r: 5, color: R ? 'faint' : 'blue', noDim: true }); return; }
            if (!R) G.vec(p, { color: 'blue', label: lab, width: 2.3, size: 14 });
            else if (k) G.vec(p, { color: 'green', label: lab, width: 3, size: 14 });
            else G.vec(p, { color: 'faint', label: lab, width: 1.5, dash: [4, 4], head: 7, size: 13 });
          });
          G.overlay(() => chips(v, G.S, L.map((p, i) => ({ t: `v${SUB[i]}`, color: R && kept.includes(i) ? 'green' : 'blue', state: R && !kept.includes(i) ? 'gone' : 'on' })), 10, 8));
          G.corner(R ? `${kept.length} survivor${kept.length === 1 ? '' : 's'}: a basis of V` : `a spanning list of length ${L.length}`, 'bl', { color: R ? 'green' : 'muted', weight: 600 });
          st = { L, kept, R, U };
        });
        v.readout(() => {
          if (!st) return '';
          const { L, kept, R, U } = st, names = L.map((_, i) => `v_${i + 1}`);
          if (!U.length) return 'A spanning list of $\\{0\\}$ consists of zero vectors only; the reduction deletes them all and leaves the empty list, which is a basis of $\\{0\\}$.';
          if (!R) return `The ${L.length} vectors span $V$ but are far from independent. Switch on *reduce*.`;
          const gone = L.map((_, i) => i).filter((i) => !kept.includes(i)).slice(0, 3).map((i) => {
            const before = kept.filter((j) => j < i);
            return len3(L[i]) < 1e-9 ? `$v_${i + 1}=0$` : `$v_${i + 1} = ${combTeX(coords(M, before.map((j) => L[j]), L[i]), before.map((j) => names[j]))}$`;
          });
          return `Survivors $${kept.map((i) => names[i]).join(',')}$: a basis of $V$ (length ${kept.length}). Struck out, e.g.: ${gone.join('; ')}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.32
    {
      num: '2.32',
      kind: 'Theorem',
      name: 'Every linearly independent list extends to a basis',
      statement: String.raw`Every linearly independent list of vectors in a finite-dimensional vector space can be extended to a basis of the vector space.`,
      idea: String.raw`Let $u_1,\dots,u_m$ be linearly independent and $w_1,\dots,w_n$ a spanning list of $V$ (one exists by 2.9). The concatenation $u_1,\dots,u_m,w_1,\dots,w_n$ spans $V$, so the procedure of 2.30 reduces it to a basis. That procedure never deletes a $u_k$, because $u_k$ is not in the span of $u_1,\dots,u_{k-1}$ (independence); so the basis consists of all the $u$'s plus some of the $w$'s.`,
      caption: String.raw`Drag $u_1$ and $u_2$ (coordinates snap to multiples of $\tfrac12$, so you can put the plane $\operatorname{span}(u_1,u_2)$ through a coordinate axis). The list $u_1,u_2,e_1,e_2,e_3$ is sifted as in 2.30: an $e_k$ survives (green) exactly when it is not in the span of everything kept before it. The survivors complete the $u$'s to a basis (green parallelepiped). Break the hypothesis by dragging $u_2$ onto the line of $u_1$: then the sifting deletes $u_2$ itself.`,
      deps: ['ladr-2.30', 'ladr-2.9'],
      tags: ['bases'],
      viz(v) {
        const M = v.M;
        const G = scene3(v, { height: 400 });
        const len = v.select('independent list', [{ value: '1', label: '$u_1$' }, { value: '2', label: '$u_1,u_2$' }], '2');
        const h1 = G.handle([1, 0.5, 0.5], { color: 'blue', constrain: (q) => snapGrid(q) });
        const h2 = G.handle([0, 1, 1], { color: 'purple', constrain: (q) => snapInto(snapGrid(q), orth([h1.p]), 0.16) });
        const E = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        let st = null;
        v.legend([['accent', '$\\operatorname{span}(u_1,\\dots,u_m)$', { area: true }], ['green', 'survivors', { area: true }], ['faint', 'deleted', { dash: true }]]);
        G.render(() => {
          const m = +len.value; h2.visible = m === 2;
          const us = [h1.p, h2.p].slice(0, m), list = [...us, ...E], kept = siftIdx(list);
          const Bu = orth(us);
          G.subspace(Bu, { color: 'accent', r: 1.9 });
          if (kept.length === 3) parallelepiped(G, list[kept[0]], list[kept[1]], list[kept[2]], { color: 'green', fillAlpha: 0.06, alpha: 0.35 });
          const names = [...us.map((_, i) => `u_${i + 1}`), 'e_1', 'e_2', 'e_3'], cols = ['blue', 'purple'];
          list.forEach((p, i) => {
            const k = kept.includes(i), isU = i < m;
            if (isU) G.vec(p, { color: k ? cols[i] : 'red', label: names[i], width: 2.8, dash: k ? undefined : [4, 4] });
            else if (k) G.vec(p, { color: 'green', label: names[i], width: 3 });
            else G.vec(p, { color: 'faint', label: names[i], width: 1.6, dash: [4, 4], head: 7 });
          });
          G.overlay(() => chips(v, G.S, names.map((n, i) => ({ t: n.replace('_', '').replace(/\d/, (d) => SUB[d - 1]), color: i < m ? (kept.includes(i) ? cols[i] : 'red') : 'green', state: kept.includes(i) ? 'on' : i < m ? 'hot' : 'gone' })), 10, 8));
          st = { m, us, list, kept, names, uOK: kept.filter((i) => i < m).length === m };
        });
        v.readout(() => {
          if (!st) return '';
          const { m, list, kept, names, uOK } = st;
          if (!uOK) return `$u_2$ is a multiple of $u_1$, so the list is not independent and the sifting deletes $u_2$ itself: the result is a basis, but it does not extend $u_1,u_2$. Independence is what protects the $u$'s.`;
          const gone = [m, m + 1, m + 2].filter((i) => !kept.includes(i)).map((i) => { const b = kept.filter((j) => j < i); return `$${names[i]} = ${combTeX(coords(M, b.map((j) => list[j]), list[i]), b.map((j) => names[j]))}$`; });
          return `Basis: $${kept.map((i) => names[i]).join(',')}$ — all the $u$'s plus ${3 - m} standard vector${3 - m === 1 ? '' : 's'}. Deleted because already in the span of what was kept: ${gone.join('; ')}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.33
    {
      num: '2.33',
      kind: 'Theorem',
      name: 'Every subspace of V is part of a direct sum equal to V',
      statement: String.raw`Suppose $V$ is finite-dimensional and $U$ is a subspace of $V$. Then there is a subspace $W$ of $V$ such that $V=U\oplus W$.`,
      idea: String.raw`$U$ is finite-dimensional (2.25), so it has a basis $u_1,\dots,u_m$ (2.31), which extends to a basis $u_1,\dots,u_m,w_1,\dots,w_n$ of $V$ (2.32). Put $W=\spn(w_1,\dots,w_n)$. Every $v\in V$ is a combination of the whole basis, so $V=U+W$; and a vector in $U\cap W$ is a combination of the $u$'s and of the $w$'s at once, which subtract to a relation that independence forces to be trivial. So $U\cap W=\{0\}$ and the sum is direct by 1.46.`,
      caption: String.raw`Choose $U$ (a line or a plane) and drag its spanning vectors. Extending a basis of $U$ by $e_1,e_2,e_3$ (as in 2.32) gives the orange complement $W$. Drag the gold $v$: it splits as $v=u+w$ with $u\in U$, $w\in W$, and the split is unique. *Another complement* tilts $W$ — still $U\oplus W=\mathbf R^3$, but the split of $v$ changes: complements are not unique.`,
      deps: ['ladr-2.25', 'ladr-2.31', 'ladr-2.32', 'ladr-1.46'],
      tags: ['direct sums', 'bases'],
      viz(v) {
        const M = v.M;
        const G = scene3(v, { height: 410 });
        const Ut = v.select('$U$', [{ value: '1', label: 'a line' }, { value: '2', label: 'a plane' }], '1');
        const Wt = v.select('$W$', [{ value: 'std', label: 'extend by $e_1,e_2,e_3$' }, { value: 'tilt', label: 'another complement' }], 'std');
        const h1 = G.handle([0.9, 0.6, 0.85], { color: 'blue' });
        const h2 = G.handle([-0.7, 1.0, 0.3], { color: 'blue', constrain: (q) => snapInto(q, orth([h1.p]), 0.16) });
        const hv = G.handle([0.4, -1.2, 1.1], { color: 'gold' });
        let st = null;
        v.legend([['blue', '$U$', { area: true }], ['orange', '$W$', { area: true }], ['gold', '$v=u+w$']]);
        G.render(() => {
          const m = +Ut.value; h2.visible = m === 2;
          const us = [h1.p, h2.p].slice(0, m), ub = siftIdx(us).map((i) => us[i]);
          const E = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], all = [...ub, ...E], kept = siftIdx(all);
          let ws = kept.filter((i) => i >= ub.length).map((i) => all[i]);
          if (Wt.value === 'tilt') ws = ws.map((w, i) => add3(w, mul3(ub[0], i ? -0.5 : 0.8)));
          const BU = orth(ub), BW = orth(ws);
          if (BU.length === 2) G.disc(BU, { color: 'blue', r: 1.9, fillAlpha: 0.12 }); else G.lineSpan(BU[0], { color: 'blue', width: 4, len: 2.2, alpha: 0.5 });
          if (BW.length === 2) G.disc(BW, { color: 'orange', r: 1.9, fillAlpha: 0.12 }); else if (BW.length === 1) G.lineSpan(BW[0], { color: 'orange', width: 4, len: 2.2, alpha: 0.5 });
          const c = coords(M, [...ub, ...ws], hv.p), u = comb(c.slice(0, ub.length), ub), w = comb(c.slice(ub.length), ws);
          G.line(w, hv.p, { color: 'muted', width: 1.2, dash: [3, 4] }); G.line(u, hv.p, { color: 'muted', width: 1.2, dash: [3, 4] });
          G.vec(u, { color: 'blue', label: 'u', width: 3 }); G.vec(w, { color: 'orange', label: 'w', width: 3 });
          G.vec(hv.p, { color: 'gold', label: 'v', width: 2.6 });
          us.forEach((p, i) => G.vec(p, { color: 'blue', label: `u_${i + 1}`, width: 1.6, alpha: 0.7, head: 7, size: 13 }));
          ws.forEach((p, i) => G.vec(p, { color: 'orange', label: Wt.value === 'std' ? `e_${[1, 2, 3].filter((j) => kept.includes(ub.length + j - 1))[i]}` : `w_${i + 1}`, width: 1.6, alpha: 0.7, head: 7, size: 13 }));
          G.corner(`dim U + dim W = ${BU.length} + ${BW.length} = 3,   U ∩ W = {0}`, 'tl', { color: 'green', weight: 600 });
          st = { u, w, dU: BU.length, dW: BW.length, ub, ws, tilt: Wt.value === 'tilt' };
        });
        v.readout(() => {
          if (!st) return '';
          const { u, w, dU, ws, tilt } = st;
          return `$v = u + w$ with $u = ${vecTeX(u)} \\in U$ and $w = ${vecTeX(w)} \\in W$. ${dU === 1 ? 'The line' : 'The plane'} $U$ and ${ws.length === 1 ? 'the line' : 'the plane'} $W$ meet only in $0$, so this split is the only one: $\\mathbf R^3 = U\\oplus W$.` + (tilt ? ' This $W$ is a different complement of the same $U$ — and gives a different split.' : ' Here $W$ is spanned by the standard vectors that survived the extension.');
        });
      },
    },
    // ------------------------------------------------------------------ 2.34
    {
      num: '2.34',
      kind: 'Theorem',
      name: 'Basis length does not depend on basis',
      statement: String.raw`Any two bases of a finite-dimensional vector space have the same length.`,
      idea: String.raw`Let $B_1$ and $B_2$ be bases of $V$. Then $B_1$ is linearly independent and $B_2$ spans $V$, so 2.22 gives $\operatorname{length}B_1\le\operatorname{length}B_2$. Swapping the roles — $B_2$ independent, $B_1$ spanning — gives the reverse inequality.`,
      caption: String.raw`Everything happens in the tilted plane $V$. The list $A=a_1,a_2$ (blue) and a second list $B$ of length $1$, $2$ or $3$ (orange) can be dragged within $V$. The table checks each list for independence and spanning (the dots of $V$ turn green where $\operatorname{span}B$ reaches them) and applies 2.22 in both directions. Only when both lists are bases do both inequalities hold — and then the lengths agree.`,
      deps: ['ladr-2.22', 'ladr-2.26'],
      tags: ['bases', 'dimension'],
      viz(v) {
        const G = scene3(v, { height: 380, minWidth: 300, weight: 1.5 });
        const T = v.stage({ x: [0, 10], y: [0, 10], height: 380, axes: false, minWidth: 250, title: 'what 2.22 gives' });
        const nB = v.select('list $B$', [{ value: '1', label: '$b_1$' }, { value: '2', label: '$b_1,b_2$' }, { value: '3', label: '$b_1,b_2,b_3$' }], '2');
        const VB = orth([[1, 0, -0.8], [0, 1, -0.4]]), inV = (q, f) => intoSpan(q, VB, f);
        const HA = [], HB = [];
        [[1.3, 0.2, -1.12], [-0.2, 1.2, -0.32]].forEach((p, i) => HA.push(G.handle(projOnto(p, VB), { color: 'blue', constrain: (q, f) => { const x = inV(q, f); return i ? snapInto(x, orth([HA[0].p]), 0.16) : x; } })));
        [[0.9, 0.9, -1.08], [-1.1, 0.5, 0.68], [0.3, -1.2, 0.24]].forEach((p, i) => HB.push(G.handle(projOnto(p, VB), { color: 'orange', constrain: (q, f) => { const x = inV(q, f); return i ? snapInto(x, orth(HB.slice(0, i).map((h) => h.p)), 0.16) : x; } })));
        const DOTS = []; for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) { const p = add3(mul3(VB[0], i * 0.42), mul3(VB[1], j * 0.42)); if (len3(p) < 1.85) DOTS.push(p); }
        let st = null;
        v.legend([['blue', 'list $A$'], ['orange', 'list $B$'], ['green', 'points of $V$ in $\\operatorname{span}B$', { dot: true }]]);
        G.render(() => {
          const k = +nB.value; HB.forEach((h, i) => { h.visible = i < k; });
          const A = HA.map((h) => h.p), B = HB.slice(0, k).map((h) => h.p), OA = orth(A), OB = orth(B);
          G.disc(VB, { color: 'muted', r: 1.95, fillAlpha: 0.08, alpha: 0.35 });
          for (const p of DOTS) { const ok = distTo(p, OB) < 1e-6; G.dot(p, { r: ok ? 2.6 : 2, color: ok ? 'green' : 'faint', ring: false }); }
          if (OB.length === 1) G.lineSpan(OB[0], { color: 'orange', width: 4, alpha: 0.35, len: 2 });
          A.forEach((p, i) => G.vec(p, { color: 'blue', label: `a_${i + 1}`, width: 2.8 }));
          B.forEach((p, i) => G.vec(p, { color: 'orange', label: `b_${i + 1}`, width: 2.8 }));
          G.text('V', mul3(VB[0], -1.75), { color: 'muted', math: true, size: 17 });
          st = { lA: 2, lB: k, iA: OA.length === 2, sA: OA.length === 2, iB: OB.length === k, sB: OB.length === 2 };
        });
        v.render(() => {
          if (!st) return;
          const { lA, lB, iA, sA, iB, sB } = st, ck = (b) => (b ? '✓' : '✗'), col = (b) => (b ? 'green' : 'red');
          const row = (y, name, color, l, i, s) => {
            T.text(name, 0.5, y, { math: true, size: 18, color });
            T.text(String(l), 3.6, y, { size: 15, align: 'center' });
            T.text(ck(i), 6, y, { size: 16, align: 'center', color: col(i), weight: 700 });
            T.text(ck(s), 8.6, y, { size: 16, align: 'center', color: col(s), weight: 700 });
          };
          T.text('length', 3.6, 9.2, { align: 'center', color: 'muted', size: 12 }); T.text('indep.', 6, 9.2, { align: 'center', color: 'muted', size: 12 }); T.text('spans V', 8.6, 9.2, { align: 'center', color: 'muted', size: 12 });
          T.line(0.3, 8.6, 9.7, 8.6, { color: 'faint', width: 1 });
          row(7.8, 'A', 'blue', lA, iA, sA); row(6.6, 'B', 'orange', lB, iB, sB);
          T.line(0.3, 5.8, 9.7, 5.8, { color: 'faint', width: 1 });
          const l1 = iA && sB, l2 = iB && sA;
          T.text(l1 ? `A indep., B spans ⇒ ${lA} ≤ ${lB}` : 'A indep. & B spans? no', 0.5, 4.8, { color: l1 ? 'ink' : 'faint', size: 13 });
          T.text(l2 ? `B indep., A spans ⇒ ${lB} ≤ ${lA}` : 'B indep. & A spans? no', 0.5, 3.7, { color: l2 ? 'ink' : 'faint', size: 13 });
          T.text(l1 && l2 ? `both bases: lengths ${lA} = ${lB}` : 'not both bases', 0.5, 2.2, { color: l1 && l2 ? 'green' : 'red', size: 14, weight: 700 });
        });
        v.readout(() => {
          if (!st) return '';
          const { lB, iA, sA, iB, sB } = st;
          if (iA && sA && iB && sB) return 'Both lists are bases of the plane $V$: each is independent while the other spans, so 2.22 applies both ways and the lengths are equal (both $2$).';
          const bad = [];
          if (!iB) bad.push(`$B$ is dependent (${lB} vectors${lB === 3 ? ' in a plane' : ''})`); if (!sB) bad.push('$B$ does not span $V$ — red-free points are missing');
          if (!iA || !sA) bad.push('$A$ is not a basis');
          return `${bad.join('; ')}. Only one inequality is available, so nothing forces the lengths to agree — and they ${lB === 2 ? 'need not' : 'do not'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.35
    {
      num: '2.35',
      kind: 'Definition',
      name: 'Dimension',
      statement: String.raw`The *dimension* of a finite-dimensional vector space $V$, denoted $\dim V$, is the length of any basis of $V$. By 2.34 this does not depend on the basis chosen.

For example, $\dim\mathbf F^n=n$ (standard basis) and $\dim\mathcal P_m(\mathbf F)=m+1$ (basis $1,z,\dots,z^m$).`,
      idea: String.raw`A definition like this is legitimate only because of 2.34: every basis has the same length, so the number is a property of the space and not of a choice. Bases exist by 2.31, so every finite-dimensional space has a dimension; it counts the independent directions, or equally the number of coordinates needed to describe a vector.`,
      caption: String.raw`Choose a space and press *New random basis*: the app samples six random vectors of the space (for $\mathcal P_2(\mathbf R)$, six random quadratics, drawn as coefficient points), sifts them as in 2.30, and records the length of the basis it finds. *Run 20 trials* repeats this. The tally on the right never shows more than one bar: every basis found has the same length — the dimension.`,
      deps: ['ladr-2.34'],
      see: ['pma-9.1'],
      tags: ['dimension'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dimension_(vector_space)' },
      viz(v) {
        const G = scene3(v, { height: 360, minWidth: 300, weight: 1.6 });
        const T = v.stage({ x: [-0.6, 4.6], y: [0, 10], height: 360, axes: 'box', minWidth: 220, xticks: [0, 1, 2, 3, 4], xlabel: 'basis length', title: 'tally of bases found' });
        const sp = v.select('space', [{ value: 'line', label: 'a line' }, { value: 'plane', label: 'a plane' }, { value: 'R3', label: '$\\mathbf R^3$' }, { value: 'P2', label: '$\\mathcal P_2(\\mathbf R)$' }], 'plane');
        const nP = [0.6, 0.3, 0.75], dirL = [0.8, -0.35, 0.5];
        let seed = 1, cur = null;
        const tally = { line: [], plane: [], R3: [], P2: [] };
        function sample(kind, r) {
          if (kind === 'line') { const t = r.uniform(-1.6, 1.6); return mul3(unit3(dirL), Math.abs(t) < 0.3 ? 0.3 * Math.sign(t || 1) : t); }
          if (kind === 'plane') { for (;;) { const x = r.uniform(-1.4, 1.4), y = r.uniform(-1.4, 1.4), p = [x, y, -(nP[0] * x + nP[1] * y) / nP[2]]; if (len3(p) > 0.5 && len3(p) < 1.8) return p; } }
          if (kind === 'R3') { for (;;) { const p = [r.uniform(-1.3, 1.3), r.uniform(-1.3, 1.3), r.uniform(-1.3, 1.3)]; if (len3(p) > 0.5 && len3(p) < 1.8) return p; } }
          // a random quadratic c (x − r1)(x − r2), or a random line or constant: its coefficient point (a0, a1, a2)
          const c = r.uniform(0.4, 1) * (r() < 0.5 ? -1 : 1), r1 = r.uniform(-1.5, 1.5), r2 = r.uniform(-1.5, 1.5), t = r();
          if (t < 0.6) return [c * r1 * r2, -c * (r1 + r2), c].map((x) => Math.max(-1.6, Math.min(1.6, x)));
          if (t < 0.85) return [-c * r1, c, 0]; return [c * 1.4, 0, 0];
        }
        function trial() {
          const kind = sp.value, r = v.rng(seed++ * 7919 + kind.length), L = Array.from({ length: 6 }, () => sample(kind, r)), kept = siftIdx(L);
          cur = { kind, L, kept }; tally[kind].push(kept.length);
        }
        v.button('New random basis', trial);
        v.button('Run 20 trials', () => { for (let i = 0; i < 20; i++) trial(); });
        let st = null, last = null;
        v.legend([['faint', 'six random vectors of the space', { dash: true }], ['green', 'the basis found by sifting'], ['green', 'tally', { area: true }]]);
        G.render(() => {
          const kind = sp.value;
          if (kind !== last) { last = kind; G.labels = kind === 'P2' ? ['a₀', 'a₁', 'a₂'] : ['x', 'y', 'z']; if (!tally[kind].length) trial(); else if (!cur || cur.kind !== kind) trial(); }
          const { L, kept } = cur;
          if (kind === 'line') G.lineSpan(dirL, { color: 'orange', width: 3, len: 2.2 });
          else if (kind === 'plane') G.disc(orth([[1, 0, -0.8], [0, 1, -0.4]]), { color: 'orange', r: 2, fillAlpha: 0.1 });
          else G.cube(1.6, { color: 'orange' });
          L.forEach((p, i) => { if (!kept.includes(i)) G.vec(p, { color: 'faint', width: 1.4, dash: [4, 4], head: 7 }); });
          kept.forEach((i, j) => G.vec(L[i], { color: 'green', width: 3, label: kind === 'P2' ? `p_${j + 1}` : `b_${j + 1}` }));
          if (kept.length === 3) parallelepiped(G, L[kept[0]], L[kept[1]], L[kept[2]], { color: 'green', fillAlpha: 0.05, alpha: 0.3 });
          G.corner(`basis of length ${kept.length}`, 'tl', { color: 'green', weight: 600 });
          st = { kind, L, kept, n: tally[kind].length };
        });
        v.render(() => {
          if (!st) return;
          const t = tally[st.kind], counts = [0, 1, 2, 3, 4].map((k) => t.filter((x) => x === k).length), mx = Math.max(5, ...counts);
          T.setView(null, [0, mx * 1.18]);
          counts.forEach((c, k) => { if (c) { T.rect(k - 0.32, 0, k + 0.32, c, { fill: 'green', fillAlpha: 0.35, color: 'green', width: 1.5 }); T.text(String(c), k, c, { align: 'center', baseline: 'bottom', dy: -4, size: 13, color: 'green', weight: 600 }); } });
          T.corner(`${t.length} trial${t.length === 1 ? '' : 's'}`, 'tr', { color: 'muted' });
        });
        v.readout(() => {
          if (!st) return '';
          const { kind, L, kept, n } = st, d = kept.length;
          const name = { line: 'the line', plane: 'the plane', R3: '$\\mathbf R^3$', P2: '$\\mathcal P_2(\\mathbf R)$' }[kind];
          let extra = '';
          if (kind === 'P2') extra = ' Basis found: ' + kept.map((i, j) => { const c = L[i]; return `$p_${j + 1} = ${combTeX([c[0], c[1], c[2]], ['1', 'x', 'x^2'])}$`; }).join(', ') + '.';
          return `All ${n} bases of ${name} found so far have length ${d}, so $\\dim = ${d}$.${extra}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.37
    {
      num: '2.37',
      kind: 'Theorem',
      name: 'Dimension of a subspace',
      statement: String.raw`If $V$ is finite-dimensional and $U$ is a subspace of $V$, then $\dim U\le\dim V$.`,
      idea: String.raw`$U$ is finite-dimensional by 2.25, so it has a basis. That basis is a linearly independent list in $V$, and a basis of $V$ is a spanning list of $V$; by 2.22 the first is no longer than the second.`,
      caption: String.raw`Choose the ambient space $V$ — all of $\mathbf R^3$, or the tilted plane $W$ — and drag up to four vectors, which stay inside $V$ (a tip near the span of the earlier ones snaps into it). $U$ is their span, shaded blue. The gauge on the right compares $\dim U$ with $\dim V$: however you drag, $U$ never outgrows $V$ — a third independent vector cannot be placed in the plane, a fourth not in $\mathbf R^3$.`,
      deps: ['ladr-2.22', 'ladr-2.35', 'ladr-2.25'],
      tags: ['dimension'],
      viz(v) {
        const G = scene3(v, { height: 380, minWidth: 300, weight: 1.7 });
        const T = v.stage({ x: [0, 3], y: [-0.4, 3.6], height: 380, axes: false, minWidth: 190, title: 'dimension gauge' });
        const Vs = v.select('$V$', [{ value: '3', label: '$\\mathbf R^3$' }, { value: '2', label: 'the plane $W$' }], '3');
        const kS = v.slider('number of vectors', 1, 4, 4, { int: true });
        const VB = { 3: orth([[1, 0, 0], [0, 1, 0], [0, 0, 1]]), 2: orth([[1, 0, -0.8], [0, 1, -0.4]]) };
        const H = [];
        [[1.3, 0.2, 0.1], [0.1, 1.2, 0.4], [-0.3, 0.3, 1.3], [0.9, -0.9, 0.7]].forEach((p, i) => H.push(G.handle(p, {
          color: VC[i],
          constrain: (q, f) => snapInto(intoSpan(q, VB[Vs.value], f), orth(H.slice(0, i).map((h) => h.p)), 0.16),
        })));
        let st = null, lastV = null;
        v.legend([['accent', '$U = \\operatorname{span}$ of the vectors', { area: true }], ['orange', 'the ambient space $V$', { area: true }]]);
        G.render(() => {
          const VBv = VB[Vs.value], k = kS.value;
          if (Vs.value !== lastV) { lastV = Vs.value; H.forEach((h) => { h.p = projOnto(h.p, VBv); if (len3(h.p) < 0.4) h.p = mul3(VBv[0], 1.2); }); }
          H.forEach((h, i) => { h.visible = i < k; });
          const vs = H.slice(0, k).map((h) => h.p), B = orth(vs), kept = siftIdx(vs);
          if (VBv.length === 2) G.disc(VBv, { color: 'orange', r: 2.05, fillAlpha: 0.07 }); else G.cube(1.6, { color: 'orange' });
          if (B.length === 2) G.disc(B, { color: 'accent', r: 1.75, fillAlpha: 0.2 }); else if (B.length === 1) G.lineSpan(B[0], { color: 'accent', width: 6, alpha: 0.4 }); else if (B.length === 3) G.cube(1.25, { color: 'accent' });
          vs.forEach((p, i) => G.vec(p, { color: kept.includes(i) ? VC[i] : 'faint', label: `v_${i + 1}`, width: kept.includes(i) ? 2.8 : 1.8, dash: kept.includes(i) ? undefined : [4, 4] }));
          st = { dU: B.length, dV: VBv.length, k, kept };
        });
        v.render(() => {
          if (!st) return;
          const { dU, dV, k, kept } = st;
          for (let j = 0; j < 3; j++) { T.rect(0.35, j, 1.15, j + 0.92, { fill: j < dU ? 'accent' : 'grid', fillAlpha: j < dU ? 0.55 : 0.4, color: j < dU ? 'accent' : 'faint', width: 1 }); T.rect(1.85, j, 2.65, j + 0.92, { fill: j < dV ? 'orange' : 'grid', fillAlpha: j < dV ? 0.5 : 0.4, color: j < dV ? 'orange' : 'faint', width: 1 }); }
          T.text(`dim U = ${dU}`, 0.75, -0.22, { align: 'center', size: 13, color: 'accent', weight: 600 }); T.text(`dim V = ${dV}`, 2.25, -0.22, { align: 'center', size: 13, color: 'orange', weight: 600 });
          T.text(dU <= dV ? '≤  ✓' : '>', 1.5, 1.5, { align: 'center', size: 18, color: dU <= dV ? 'green' : 'red', weight: 700 });
          T.text(`${k - kept.length} of ${k} vectors redundant`, 1.5, 3.35, { align: 'center', size: 12, color: 'muted' });
        });
        v.readout(() => {
          if (!st) return '';
          const { dU, dV, k, kept } = st, names = Array.from({ length: k }, (_, i) => `v_${i + 1}`);
          return `$U = \\operatorname{span}(${names.join(',')})$ has basis $${kept.map((i) => names[i]).join(',')}$, so $\\dim U = ${dU} \\le ${dV} = \\dim V$.` + (k > dV ? ` With ${k} vectors in a space of dimension ${dV}, at least ${k - dV} must lie in the span of the others.` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 2.38
    {
      num: '2.38',
      kind: 'Theorem',
      name: 'Linearly independent list of the right length is a basis',
      statement: String.raw`Suppose $V$ is finite-dimensional. Then every linearly independent list of vectors in $V$ of length $\dim V$ is a basis of $V$.`,
      idea: String.raw`By 2.32 the list extends to a basis of $V$. Every basis of $V$ has length $\dim V$ (2.34–2.35), and the list already has that length, so the extension adds no vectors: the list itself is the basis. In particular it spans $V$ — spanning comes for free.`,
      caption: String.raw`Drag $v_1,v_2,v_3$ (a tip near the span of the earlier vectors snaps into it) and the gold target $w$. While the parallelepiped has positive volume the list is independent, and — as the theorem promises — it also spans: $w$ is reached by the path $a_1v_1\to a_2v_2\to a_3v_3$, whatever $w$ is. Collapse the volume and some targets become unreachable (red gap). With only two vectors the list is independent but too short to span.`,
      deps: ['ladr-2.32', 'ladr-2.35'],
      see: ['pma-9.3'],
      tags: ['bases', 'dimension'],
      viz(v) {
        const M = v.M;
        const G = scene3(v, { height: 410 });
        const len = v.select('list', [{ value: '2', label: '$v_1,v_2$ (length 2)' }, { value: '3', label: '$v_1,v_2,v_3$ (length 3)' }], '3');
        const H = [];
        [[1.3, 0.1, -0.1], [0.2, 1.25, 0.15], [0.2, 0.3, 1.2]].forEach((p, i) => H.push(G.handle(p, { color: VC[i], constrain: (q) => (i ? snapInto(q, orth(H.slice(0, i).map((h) => h.p)), 0.16) : q) })));
        const hw = G.handle([1.2, 0.9, 1.1], { color: 'gold' });
        let st = null;
        v.legend([['accent', 'parallelepiped of the list', { area: true }], ['gold', 'target $w$'], ['red', 'unreachable gap', { dash: true }]]);
        G.render(() => {
          const k = +len.value; H.forEach((h, i) => { h.visible = i < k; });
          const vs = H.slice(0, k).map((h) => h.p), B = orth(vs), w = hw.p;
          if (k === 3) parallelepiped(G, vs[0], vs[1], vs[2], { color: 'accent', fillAlpha: 0.07, alpha: 0.4 });
          if (B.length === 2) G.disc(B, { color: 'accent', r: 2, fillAlpha: 0.1 });
          if (k === 2) G.poly([ZERO, vs[0], add3(vs[0], vs[1]), vs[1]], { fill: 'accent', fillAlpha: 0.16, occlude: false });
          const a = coords(M, vs, w), reach = comb(a, vs), gap = len3(sub3(reach, w));
          let s = ZERO;
          vs.forEach((p, i) => { const n = add3(s, mul3(p, a[i])); G.arrow(s, n, { color: VC[i], width: 2.4, dash: [6, 4], head: 9 }); s = n; });
          if (gap > 1e-6) { G.line(reach, w, { color: 'red', width: 2.4, dash: [4, 4] }); G.dot(reach, { r: 4, color: 'muted' }); }
          vs.forEach((p, i) => G.vec(p, { color: VC[i], label: `v_${i + 1}`, width: 2.8 }));
          G.vec(w, { color: 'gold', label: 'w', width: 1.6, dash: [2, 3], head: 0 });
          const vol = k === 3 ? Math.abs(det3(vs[0], vs[1], vs[2])) : len3(cross(vs[0], vs[1]));
          G.corner(`${k === 3 ? 'volume' : 'area'} = ${v.fix(vol, 3)}   ·   ${gap > 1e-6 ? 'w not reached' : 'w reached'}`, 'tl', { color: gap > 1e-6 ? 'red' : 'green', weight: 600 });
          st = { k, a, gap, ind: B.length === k, vol };
        });
        v.readout(() => {
          if (!st) return '';
          const { k, a, gap, ind } = st;
          if (k === 3 && ind) return `Independent, and of length $3 = \\dim\\mathbf R^3$: by 2.38 a basis. Indeed $w = ${combTeX(a, ['v_1', 'v_2', 'v_3'])}$ — drag $w$ anywhere and it is still reached.`;
          if (k === 3) return `Volume $0$: the list is dependent, the hypothesis fails, and the list spans only a plane — $w$ misses it by $${v.fix(gap, 3)}$.`;
          return ind ? `Independent but of length $2 < 3 = \\dim\\mathbf R^3$: the right length matters. ${gap > 1e-6 ? `$w$ misses the plane by $${v.fix(gap, 3)}$.` : '$w$ happens to lie in the plane.'}` : 'The two vectors are parallel: dependent and not spanning.';
        });
      },
    },
    // ------------------------------------------------------------------ 2.39
    {
      num: '2.39',
      kind: 'Theorem',
      name: 'Subspace of full dimension equals the whole space',
      statement: String.raw`Suppose $V$ is finite-dimensional and $U$ is a subspace of $V$ with $\dim U=\dim V$. Then $U=V$.`,
      idea: String.raw`Let $u_1,\dots,u_n$ be a basis of $U$, so $n=\dim U=\dim V$. It is a linearly independent list in $V$ of length $\dim V$, hence a basis of $V$ by 2.38. So every vector of $V$ is a combination of the $u$'s, i.e. lies in $U$.`,
      caption: String.raw`Choose $V$ ($\mathbf R^3$ or the plane $W$) and grow the subspace $U$ by adding vectors (they stay in $V$; a tip near the span of the earlier ones snaps into it). The dots are a grid of sample points of $V$, lit green when they lie in $U$. Line, plane: almost all of $V$ stays dark. The moment $\dim U$ reaches $\dim V$, every sample point lights up — $U$ has become $V$.`,
      deps: ['ladr-2.38'],
      tags: ['dimension'],
      viz(v) {
        const G = scene3(v, { height: 410 });
        const Vs = v.select('$V$', [{ value: '3', label: '$\\mathbf R^3$' }, { value: '2', label: 'the plane $W$' }], '3');
        const kS = v.slider('vectors spanning $U$', 0, 3, 2, { int: true });
        const VB = { 3: orth([[1, 0, 0], [0, 1, 0], [0, 0, 1]]), 2: orth([[1, 0, -0.8], [0, 1, -0.4]]) };
        const H = [];
        [[1.25, 0.25, 0.15], [0.05, 1.2, 0.5], [-0.35, 0.2, 1.25]].forEach((p, i) => H.push(G.handle(p, { color: VC[i], constrain: (q, f) => snapInto(intoSpan(q, VB[Vs.value], f), orth(H.slice(0, i).map((h) => h.p)), 0.16) })));
        const grid = { 3: [], 2: [] };
        for (const a of [-1, -0.5, 0, 0.5, 1]) for (const b of [-1, -0.5, 0, 0.5, 1]) for (const c of [-1, -0.5, 0, 0.5, 1]) grid[3].push([a * 1.2, b * 1.2, c * 1.2]);
        for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) { const p = add3(mul3(VB[2][0], i * 0.45), mul3(VB[2][1], j * 0.45)); if (len3(p) < 1.9) grid[2].push(p); }
        let st = null, lastV = null;
        v.legend([['green', 'sample point of $V$ lying in $U$', { dot: true }], ['faint', 'sample point of $V$ not in $U$', { dot: true }], ['accent', '$U$', { area: true }]]);
        G.render(() => {
          const VBv = VB[Vs.value], dV = VBv.length;
          if (Vs.value !== lastV) { lastV = Vs.value; kS.input.max = dV; if (kS.value > dV) kS.value = dV; H.forEach((h, i) => { h.p = projOnto(h.p, VBv); if (len3(h.p) < 0.4) h.p = mul3(VBv[i % dV], 1.2); }); }
          const k = Math.min(kS.value, dV); H.forEach((h, i) => { h.visible = i < k; });
          const vs = H.slice(0, k).map((h) => h.p), B = orth(vs), pts = grid[Vs.value];
          if (dV === 2) G.disc(VBv, { color: 'orange', r: 2.05, fillAlpha: 0.06 });
          if (B.length === 2) G.disc(B, { color: 'accent', r: 1.9, fillAlpha: dV === 2 ? 0.22 : 0.15 }); else if (B.length === 1) G.lineSpan(B[0], { color: 'accent', width: 5, alpha: 0.4 }); else if (B.length === 3) G.cube(1.45, { color: 'accent' });
          let inside = 0;
          for (const p of pts) { const ok = distTo(p, B) < 1e-6; if (ok) inside++; G.dot(p, { r: ok ? 3.4 : 2.3, color: ok ? 'green' : 'faint', ring: false }); }
          vs.forEach((p, i) => G.vec(p, { color: VC[i], label: `u_${i + 1}`, width: 2.8 }));
          G.corner(`${inside} / ${pts.length} sample points of V lie in U`, 'tl', { color: inside === pts.length ? 'green' : 'muted', weight: 600 });
          st = { dU: B.length, dV, inside, n: pts.length, k };
        });
        v.readout(() => {
          if (!st) return '';
          const { dU, dV, inside, n } = st;
          if (dU === dV) return `$\\dim U = ${dU} = \\dim V$, and all ${n} sample points of $V$ lie in $U$: by 2.39, $U = V$.`;
          return `$\\dim U = ${dU} < ${dV} = \\dim V$: only ${inside} of the ${n} sample points lie in $U$ (those on ${dU === 0 ? 'the origin' : dU === 1 ? 'the line' : 'the plane'}). Add ${dV - dU === 1 ? 'one more independent vector' : `${dV - dU} more independent vectors`}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.42
    {
      num: '2.42',
      kind: 'Theorem',
      name: 'Spanning list of the right length is a basis',
      statement: String.raw`Suppose $V$ is finite-dimensional. Then every spanning list of vectors in $V$ of length $\dim V$ is a basis of $V$.`,
      idea: String.raw`By 2.30 the spanning list can be reduced to a basis of $V$. Every basis has length $\dim V$, which is already the length of the list, so the reduction deletes nothing: the list is itself a basis. In particular it is linearly independent — independence comes for free.`,
      caption: String.raw`The gold dots are random target vectors; each lights green when it is in the span of the list. Drag $v_1,v_2,v_3$: while all targets are green the list spans $\mathbf R^3$, and — as the theorem promises — there is no nontrivial relation. Push $v_3$ into the plane of $v_1,v_2$ (it snaps): both lamps go out together — the targets off the plane turn red *and* a closed gold loop $a_1v_1\to a_2v_2\to a_3v_3$ appears. With four vectors the list spans but is never independent: the length matters.`,
      deps: ['ladr-2.30', 'ladr-2.35'],
      see: ['pma-9.3'],
      tags: ['bases', 'dimension'],
      viz(v) {
        const M = v.M;
        const G = scene3(v, { height: 410 });
        const len = v.select('list', [{ value: '3', label: '$v_1,v_2,v_3$ (length 3)' }, { value: '4', label: '$v_1,\\dots,v_4$ (length 4)' }], '3');
        const H = [];
        [[1.3, 0.15, 0.1], [0.15, 1.25, 0.25], [0.25, 0.25, 1.25], [-0.9, 0.8, 0.7]].forEach((p, i) => H.push(G.handle(p, { color: VC[i], constrain: (q) => (i && i < 3 ? snapInto(q, orth(H.slice(0, i).map((h) => h.p)), 0.16) : q) })));
        const r = v.rng(21), TG = Array.from({ length: 90 }, () => [r.uniform(-1.4, 1.4), r.uniform(-1.4, 1.4), r.uniform(-1.4, 1.4)]);
        let st = null;
        v.legend([['green', 'target in the span', { dot: true }], ['red', 'target not in the span', { dot: true }], ['gold', 'a nontrivial relation, tip to tail']]);
        G.render(() => {
          const k = +len.value; H.forEach((h, i) => { h.visible = i < k; });
          const vs = H.slice(0, k).map((h) => h.p), B = orth(vs);
          if (B.length === 2) G.disc(B, { color: 'accent', r: 2, fillAlpha: 0.12 }); else if (B.length === 1) G.lineSpan(B[0], { color: 'accent', width: 5, alpha: 0.4 });
          let hit = 0;
          for (const p of TG) { const ok = distTo(p, B) < 1e-6; if (ok) hit++; G.dot(p, { r: 2.6, color: ok ? 'green' : 'red', alpha: 0.85, ring: false }); }
          const ns = M.nullspace([0, 1, 2].map((i) => vs.map((w) => w[i])), 1e-9);
          let rel = null;
          if (ns.length) {
            rel = ns[0]; const mx = Math.max(...rel.map(Math.abs)); rel = rel.map((x) => x / mx);
            let s = ZERO; vs.forEach((p, i) => { const n = add3(s, mul3(p, rel[i])); if (Math.abs(rel[i]) > 1e-9) G.arrow(s, n, { color: 'gold', width: 3.4, head: 11 }); s = n; });
            G.dot(ZERO, { r: 7, color: 'green', noDim: true });
          }
          vs.forEach((p, i) => G.vec(p, { color: VC[i], label: `v_${i + 1}`, width: 2.7 }));
          const spans = B.length === 3, ind = !rel;
          G.corner(`${spans ? '●' : '○'} spans ℝ³      ${ind ? '●' : '○'} linearly independent`, 'tl', { color: spans && ind ? 'green' : 'red', weight: 600 });
          st = { k, spans, ind, rel, hit };
        });
        v.readout(() => {
          if (!st) return '';
          const { k, spans, ind, rel, hit } = st, names = Array.from({ length: k }, (_, i) => `v_${i + 1}`);
          const relS = rel ? `$${combTeX(rel, names)} = 0$` : '';
          if (k === 3 && spans) return `All ${hit} targets are reached, so $v_1,v_2,v_3$ spans $\\mathbf R^3$; having length $3 = \\dim\\mathbf R^3$, it is a basis (2.42) — and indeed no nontrivial combination vanishes.`;
          if (k === 3) return `Only ${hit} of ${TG.length} targets are reached and ${relS}: spanning and independence fail together, as 2.38 and 2.42 predict for a list of length $\\dim V$.`;
          return `${spans ? 'The four vectors span $\\mathbf R^3$' : 'The four vectors do not even span'}, but ${relS}: a spanning list longer than $\\dim V$ is never independent.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.43
    {
      num: '2.43',
      kind: 'Theorem',
      name: 'Dimension of a sum',
      statement: String.raw`If $V_1$ and $V_2$ are subspaces of a finite-dimensional vector space, then
$$\dim(V_1+V_2)=\dim V_1+\dim V_2-\dim(V_1\cap V_2).$$`,
      idea: String.raw`Choose a basis $u_1,\dots,u_m$ of $V_1\cap V_2$ and extend it (2.32) to a basis $u_1,\dots,u_m,v_1,\dots,v_j$ of $V_1$ and to a basis $u_1,\dots,u_m,w_1,\dots,w_k$ of $V_2$. The combined list $u_1,\dots,u_m,v_1,\dots,v_j,w_1,\dots,w_k$ spans $V_1+V_2$, and a short computation using $V_1\cap V_2=\spn(u_1,\dots,u_m)$ shows it is linearly independent. So $\dim(V_1+V_2)=m+j+k=(m+j)+(m+k)-m$. It is the inclusion–exclusion formula of counting, for dimensions.`,
      caption: String.raw`$V_1$ (blue) is fixed; $V_2$ (orange) is spanned by $w_1$ (and $w_2$), which you can drag — a tip near $V_1$ snaps into it. The green part is $V_1\cap V_2$; the arrows $u$, $v$, $w$ are the bases from the proof. The two sides of the formula are computed independently (the intersection by solving a linear system, the sum from a spanning list). Rotate $V_2$ until it falls into $V_1$: the intersection jumps up and the sum drops by the same amount.`,
      deps: ['ladr-2.32', 'ladr-2.35'],
      tags: ['dimension'],
      credit: 'Grassmann, 1844',
      viz(v) {
        const M = v.M;
        const G = scene3(v, { height: 420 });
        const t1 = v.select('$V_1$', [{ value: '1', label: 'line' }, { value: '2', label: 'plane' }], '2');
        const t2 = v.select('$V_2$', [{ value: '1', label: 'line' }, { value: '2', label: 'plane' }], '2');
        const V1B = { 1: [unit3([1, 0.35, 0.1])], 2: orth([[1, 0, 0.25], [0, 1, -0.15]]) };
        const H = [];
        [[0.4, 1.1, 1.0], [1.1, -0.4, 0.9]].forEach((p, i) => H.push(G.handle(p, {
          color: 'orange',
          constrain: (q) => { let x = snapInto(q, V1B[t1.value], 0.16); if (i) x = snapInto(x, orth([H[0].p]), 0.16); return x; },
        })));
        let st = null;
        v.legend([['blue', '$V_1$', { area: true }], ['orange', '$V_2$', { area: true }], ['green', '$V_1\\cap V_2$', { area: true }]]);
        G.render(() => {
          const B1 = V1B[t1.value], k2 = +t2.value; H[1].visible = k2 === 2;
          const W = H.slice(0, k2).map((h) => h.p), B2 = orth(W);
          // V1 ∩ V2 from the null space of [B1 | −B2]
          const A = [0, 1, 2].map((r) => [...B1.map((b) => b[r]), ...B2.map((b) => -b[r])]);
          const ns = M.nullspace(A, 1e-9), I = orth(ns.map((n) => comb(n.slice(0, B1.length), B1)));
          const S = orth([...B1, ...B2]);
          if (B1.length === 2) G.disc(B1, { color: 'blue', r: 2, fillAlpha: 0.12 }); else G.lineSpan(B1[0], { color: 'blue', width: 4, len: 2.2, alpha: 0.55 });
          if (B2.length === 2) G.disc(B2, { color: 'orange', r: 2, fillAlpha: 0.12 }); else if (B2.length === 1) G.lineSpan(B2[0], { color: 'orange', width: 4, len: 2.2, alpha: 0.55 });
          if (I.length === 1) G.lineSpan(I[0], { color: 'green', width: 7, len: 2.1, alpha: 0.75 }); else if (I.length === 0) G.dot(ZERO, { r: 6, color: 'green', noDim: true });
          if (S.length === 3) G.cube(1.75, { color: 'purple', fillAlpha: 0.02, alpha: 0.25 });
          // the bases of the proof: u's (intersection), extended by v's (in V1) and w's (in V2)
          const us = I.map((e) => mul3(e, 1.3));
          const vx = siftIdx([...us, ...B1]).slice(us.length).map((i) => mul3([...us, ...B1][i], 1.3));
          const wx = siftIdx([...us, ...B2]).slice(us.length).map((i) => mul3([...us, ...B2][i], 1.3));
          us.forEach((p, i) => G.vec(p, { color: 'green', label: `u_${i + 1}`, width: 3.2 }));
          vx.forEach((p, i) => G.vec(p, { color: 'blue', label: `v_${i + 1}`, width: 3.2 }));
          wx.forEach((p, i) => G.vec(p, { color: 'orange', label: `w_${i + 1}`, width: 3.2, at: 0.62, off: 13 }));
          W.forEach((p) => G.dot(p, { r: 3, color: 'orange', noDim: true }));
          const d1 = B1.length, d2 = B2.length, di = I.length, ds = S.length;
          G.corner(`${d1} + ${d2} − ${di} = ${d1 + d2 - di} = dim(V₁ + V₂)`, 'tl', { color: d1 + d2 - di === ds ? 'green' : 'red', weight: 600 });
          st = { d1, d2, di, ds, m: us.length, j: vx.length, k: wx.length };
        });
        v.readout(() => {
          if (!st) return '';
          const { d1, d2, di, ds, m, j, k } = st;
          const shape = ['$\\{0\\}$', 'a line', 'a plane', 'all of $\\mathbf R^3$'];
          return `$\\dim V_1 + \\dim V_2 - \\dim(V_1\\cap V_2) = ${d1} + ${d2} - ${di} = ${d1 + d2 - di}$, and $V_1 + V_2$ is ${shape[ds]}, of dimension ${ds}. The list $u$'s, $v$'s, $w$'s has length $${m} + ${j} + ${k} = ${m + j + k}$ and is a basis of $V_1+V_2$.`;
        });
      },
    },
  ],
};

/** Status line in the top-left corner of a scene. */
function S3corner(G, text, color = 'muted') { G.corner(text, 'tl', { color, weight: 600 }); }
