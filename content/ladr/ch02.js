// Linear Algebra Done Right — Chapter 2: Finite-Dimensional Vector Spaces
// Part 1 (2.4–2.28): span, linear independence, the linear dependence lemma, the exchange theorem, bases.
// Part 2 is ch02-b.js (2.30–2.43).

import { EXCHANGE_DEFAULT, EXCHANGE_PRESETS, exchangePreset, exchangeTrace, exchangeRank, validExchangeState } from './exchange-audit.js';

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
    return G.cube(st.h ?? 1.35, { color: st.color || 'accent' });
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
  title: 'Finite-Dimensional Vector Spaces',
  summary: String.raw`Span and linear independence are defined for lists of vectors, and the linear dependence lemma becomes the workhorse: it shows that no linearly independent list is longer than a spanning list. A basis does both jobs at once; every spanning list can be pruned to a basis and every independent list enlarged to one, so all bases of a space have the same length — its dimension. The chapter closes with dimension counting: a subspace of full dimension is the whole space, a list of the right length needs only one of the two basis properties, and $\dim(V_1+V_2)$ obeys an inclusion–exclusion formula.`,
  items: [
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Definition',
      name: 'Span',
      statement: String.raw`Let $v_1,\dots,v_m$ be a list of vectors in $V$. A *linear combination* of the list is a vector $a_1v_1+\dots+a_mv_m$ with $a_1,\dots,a_m\in\mathbf F$. The *span* of the list is the set of all of its linear combinations:
$$\spn(v_1,\dots,v_m)=\{a_1v_1+\dots+a_mv_m : a_1,\dots,a_m\in\mathbf F\}.$$
The span of the empty list $(\,)$ is defined to be $\{0\}$. If $\spn(v_1,\dots,v_m)=V$, the list is said to *span* $V$.`,
      idea: String.raw`A list is a recipe — scale each vector and add — and its span is everything the recipe can produce. In $\mathbf R^3$ only four shapes can occur: the origin, a line through $0$, a plane through $0$, or all of space; that the span is always such a flat object through $0$ is Theorem 2.6. The convention $\spn(\,)=\{0\}$ (the empty sum is $0$) lets statements such as the linear dependence lemma 2.19 cover the case $k=1$ without exception.`,
      caption: String.raw`Choose the length of the list, then drag the tips of $v_1,v_2,v_3$ (drag the background to rotate). The shaded set is the span and the gold dots are random linear combinations, which fill it. The sliders build one combination $w=a_1v_1+a_2v_2+a_3v_3$ tip to tail. Drag a vector close to the span of the earlier ones and it snaps in — the span stops growing.`,
      deps: ['ladr-1.20'],
      tags: ['span'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Linear_span' },
      viz(v) {
        const M = v.M;
        const G = scene3(v, { height: 400 });
        const m = v.select('list', [{ value: '0', label: '$(\\,)$' }, { value: '1', label: '$v_1$' }, { value: '2', label: '$v_1,v_2$' }, { value: '3', label: '$v_1,v_2,v_3$' }], '2');
        const A = [0.8, -0.7, 0.6].map((a, i) => v.slider(`$a_${i + 1}$`, -2, 2, a, { step: 0.05 }));
        const H = [];
        [[1.35, 0.15, 0.35], [0.05, 1.25, 0.55], [-0.45, 0.35, 1.25]].forEach((p, i) => H.push(G.handle(p, { color: VC[i], constrain: (q) => snapInto(q, orth(H.slice(0, i).map((h) => h.p)), 0.16) })));
        const r = v.rng(11), CO = Array.from({ length: 380 }, () => [r.normal() * 0.8, r.normal() * 0.8, r.normal() * 0.8]);
        let st = null;
        v.legend([['accent', 'the span', { area: true }], ['gold', 'random linear combinations', { dot: true }], ['gold', '$w=a_1v_1+\\dots+a_mv_m$, tip to tail', { dash: true }]]);
        G.render(() => {
          const k = +m.value;
          H.forEach((h, i) => { h.visible = i < k; });
          A.forEach((s, i) => { s.el.hidden = i >= k; });
          const vs = H.slice(0, k).map((h) => h.p), B = orth(vs), d = B.length;
          if (d === 2) { const ix = siftIdx(vs); G.disc(B, { color: 'accent', r: 2 }); G.lattice(vs[ix[0]], vs[ix[1]], 2, { color: 'accent', alpha: 0.28 }); }
          else G.subspace(B, { color: 'accent', h: 1.4, len: 2.2 });
          const lim = d === 3 ? 1.4 : 1.97;
          for (const c of CO) { const p = comb(c.slice(0, k), vs); if (d === 3 ? Math.max(...p.map(Math.abs)) < lim : len3(p) < lim) G.dot(p, { r: 1.8, color: 'gold', alpha: 0.75, ring: false }); }
          vs.forEach((p, i) => G.vec(p, { color: VC[i], label: `v_${i + 1}`, width: 2.7 }));
          let s = ZERO;
          for (let i = 0; i < k; i++) { const nx = add3(s, mul3(vs[i], A[i].value)); G.arrow(s, nx, { color: VC[i], width: 1.8, dash: [5, 4], head: 8 }); s = nx; }
          G.dot(s, { r: 5.5, color: 'gold', noDim: true }); G.tex('w', s, { color: 'gold', dx: 13, dy: -11 });
          S3corner(G, [k ? 'span = {0}' : 'span() = {0}', 'span: a line through 0', 'span: a plane through 0', 'span: all of ℝ³'][d], 'muted');
          st = { k, d, w: s, dep: firstDependent(M, vs) };
        });
        v.readout(() => {
          if (!st) return '';
          const { k, d, w, dep } = st;
          const names = Array.from({ length: k }, (_, i) => `v_${i + 1}`);
          if (!k) return 'The span of the empty list is $\\{0\\}$ by convention: the only "combination" is the empty sum, $w=0$.';
          const shape = ['the single point $\\{0\\}$', 'the line through $0$ in the direction of the nonzero vector', 'a plane through $0$', 'all of $\\mathbf R^3$'][d];
          let t = `$\\operatorname{span}(${names.join(',')})$ is ${shape}. The combination $w = ${combTeX(A.slice(0, k).map((s) => s.value), names)} = ${vecTeX(w)}$ lies in it.`;
          if (dep) t += dep.k === 0 ? ' Here $v_1=0$, which spans only $\\{0\\}$.' : ` Since $v_${dep.k + 1}$ lies in the span of the earlier vectors, it does not enlarge the span.`;
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Theorem',
      name: 'Span is the smallest containing subspace',
      statement: String.raw`The span of a list of vectors in $V$ is the smallest subspace of $V$ containing all the vectors of the list. That is, $\spn(v_1,\dots,v_m)$ is a subspace of $V$ that contains each $v_k$, and every subspace of $V$ containing each $v_k$ contains $\spn(v_1,\dots,v_m)$.`,
      idea: String.raw`The span contains $0$ (take every $a_k=0$), and sums and scalar multiples of linear combinations are again linear combinations, so it is a subspace by the subspace test 1.34; taking $a_k=1$ and the other coefficients $0$ shows it contains $v_k$. Conversely, a subspace $U$ containing each $v_k$ contains each $a_kv_k$ (closed under scalar multiplication) and then every sum $a_1v_1+\dots+a_mv_m$ (closed under addition) — the whole span. Both closure properties are needed: a set that merely contains the $v_k$ need not contain their combinations.`,
      caption: String.raw`Drag $v_1$ and $v_2$ and choose a candidate $U$. The gold combinations $a_1v_1+a_2v_2$ turn green when they lie in $U$ and red when they escape. A plane tilting about the line $\mathbf Rv_1$ contains the whole span only at the tilt where it also catches $v_2$ (the slider snaps there); drag $v_2$ onto the line $\mathbf Rv_1$ and every tilt works, because the span shrinks to that line. The union $\mathbf Rv_1\cup\mathbf Rv_2$ contains both vectors but is not a subspace, and almost every combination escapes it.`,
      deps: ['ladr-2.4', 'ladr-1.34'],
      tags: ['span', 'subspaces'],
      viz(v) {
        const G = scene3(v, { height: 400 });
        const U = v.select('candidate $U$', [{ value: 'plane', label: 'plane through $\\mathbf Rv_1$' }, { value: 'space', label: '$\\mathbf R^3$' }, { value: 'union', label: '$\\mathbf Rv_1\\cup\\mathbf Rv_2$' }], 'plane');
        const tilt = v.slider('tilt of the plane', 0, 180, 25, { step: 0.5, fmt: (x) => `${x.toFixed(1)}°` });
        const h1 = G.handle([1.45, 0.25, 0.1], { color: VC[0] });
        const h2 = G.handle([0.2, 1.15, 0.85], { color: VC[1], constrain: (q) => snapInto(q, orth([h1.p]), 0.16) });
        const r = v.rng(5), CO = Array.from({ length: 220 }, () => [r.uniform(-1.2, 1.2), r.uniform(-1.2, 1.2)]).concat(Array.from({ length: 14 }, (_, i) => [-1.2 + (2.4 * i) / 13, 0]));
        let st = null;
        v.legend([['accent', '$\\operatorname{span}(v_1,v_2)$', { area: true }], ['orange', 'candidate $U$', { area: true }], ['green', 'combination in $U$', { dot: true }], ['red', 'combination not in $U$', { dot: true }]]);
        G.render(() => {
          const v1 = h1.p, v2 = h2.p, u1 = unit3(v1), mode = U.value;
          tilt.el.hidden = mode !== 'plane';
          const a = unit3(Math.abs(u1[2]) < 0.9 ? cross(u1, [0, 0, 1]) : cross(u1, [1, 0, 0])), b = cross(u1, a);
          const w2 = sub3(v2, mul3(u1, dot3(v2, u1))), par = len3(w2) < 1e-6;
          const star = par ? null : (((Math.atan2(dot3(w2, b), dot3(w2, a)) * 180) / Math.PI) + 360) % 180;
          if (star != null && mode === 'plane') { const dd = Math.abs(tilt.value - star); if (Math.min(dd, 180 - dd) < 2.5) tilt.value = Math.abs(star - 180) < 1e-9 ? 0 : star; }
          const th = (tilt.value * Math.PI) / 180, dirU = add3(mul3(a, Math.cos(th)), mul3(b, Math.sin(th))), nU = cross(u1, dirU);
          const inU = (p) => (mode === 'space' ? true : mode === 'plane' ? Math.abs(dot3(p, nU)) < 1e-6 * Math.max(1, len3(p)) : distTo(p, orth([v1])) < 1e-6 || distTo(p, orth([v2])) < 1e-6);
          // the span and the candidate
          G.subspace(orth([v1, v2]), { color: 'accent', r: 1.9 });
          if (mode === 'plane') G.disc([u1, dirU], { color: 'orange', r: 2.1, fillAlpha: 0.1 });
          else if (mode === 'space') G.cube(1.35, { color: 'orange' });
          else { G.lineSpan(v1, { color: 'orange', width: 3, len: 2.4 }); G.lineSpan(v2, { color: 'orange', width: 3, len: 2.4 }); }
          let inside = 0;
          for (const [c1, c2] of CO) { const p = add3(mul3(v1, c1), mul3(v2, c2)), ok = inU(p); if (ok) inside++; if (len3(p) < 2.1) G.dot(p, { r: 2.6, color: ok ? 'green' : 'red', alpha: 0.85, ring: false }); }
          const s = add3(v1, v2), sOk = inU(s);
          G.line(v1, s, { color: 'muted', width: 1, dash: [3, 4] }); G.line(v2, s, { color: 'muted', width: 1, dash: [3, 4] });
          G.dot(s, { r: 5, color: sOk ? 'green' : 'red', noDim: true }); G.tex('v_1+v_2', s, { color: sOk ? 'green' : 'red', dx: 26, dy: -10, size: 14 });
          G.vec(v1, { color: VC[0], label: 'v_1', width: 2.8 }); G.vec(v2, { color: VC[1], label: 'v_2', width: 2.8 });
          const in2 = inU(v2);
          S3corner(G, `${inside}/${CO.length} combinations lie in U`, inside === CO.length ? 'green' : 'red');
          st = { mode, in2, inside, par, sOk };
        });
        v.readout(() => {
          if (!st) return '';
          const { mode, in2, inside, par, sOk } = st, n = CO.length;
          const mem = `$v_1\\in U$, $v_2${in2 ? '\\in' : '\\notin'} U$; ${inside} of ${n} random combinations lie in $U$.`;
          if (mode === 'union') return `${mem} The union contains both vectors but $v_1+v_2${sOk ? '\\in' : '\\notin'} U$: it is not closed under addition, so it is not a subspace and the theorem says nothing about it.`;
          if (mode === 'space') return `${mem} $\\mathbf R^3$ is a subspace containing $v_1,v_2$, so it contains their span.`;
          if (!in2) return `${mem} This plane misses $v_2$, so it is not a competitor — only the multiples of $v_1$ stay inside, the rest of the span escapes. Tilt it until it catches $v_2$.`;
          return `${mem} ` + (par ? 'Now $v_2\\in\\mathbf Rv_1$, so the span is the line $\\mathbf Rv_1$, and it lies inside every one of the tilted planes: the span is the *smallest* subspace containing the list.' : 'This plane contains $v_1$ and $v_2$, so — being a subspace — it contains every combination: here it is exactly the span.');
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Definition',
      name: 'Finite-dimensional vector space',
      statement: String.raw`A vector space is *finite-dimensional* if some list of vectors in it spans the space. A vector space that is not finite-dimensional is called *infinite-dimensional*.

For example, $\mathbf F^n$ is finite-dimensional: the list $e_1=(1,0,\dots,0),\ \dots,\ e_n=(0,\dots,0,1)$ spans it. The space $\mathcal P(\mathbf F)$ of polynomials is infinite-dimensional.`,
      idea: String.raw`Finite-dimensionality asks for just *one* finite spanning list. For $\mathcal P(\mathbf F)$ none exists: if every polynomial in a list $p_1,\dots,p_k$ has degree at most $m$, then so does every linear combination of them, so $z^{m+1}$ is not in their span. (Over $\mathbf R$ this uses that a nonzero polynomial has only finitely many zeros, so $z^{m+1}$ cannot agree with a polynomial of degree $\le m$.)`,
      caption: String.raw`The list is $1,x,\dots,x^N$. Top: the target (red) and its best approximation from the span on $[-1,1]$ (blue, least squares). Bottom: the leftover, rescaled to fill the panel. A fixed polynomial $q$ of degree $5$ enters the span as soon as $N\ge5$ — its leftover is identically $0$. The moving target $x^{N+1}$ never does: whatever $N$ you pick, its leftover is a polynomial of degree $N+1$ with $N+1$ roots, never the zero polynomial.`,
      deps: ['ladr-2.4'],
      tags: ['dimension'],
      viz(v) {
        const M = v.M;
        const N = v.slider('list $1,x,\\dots,x^N$, $N=$', 0, 8, 3, { int: true });
        const tgt = v.select('target', [{ value: 'next', label: '$x^{N+1}$' }, { value: 'fixed', label: '$q$ (degree 5)' }], 'next');
        const top = v.stage({ x: [-1.08, 1.08], y: [-1.25, 1.25], height: 250, full: true, xlabel: 'x', title: 'target and its best approximation from $\\operatorname{span}(1,x,\\dots,x^N)$' });
        const bot = v.stage({ x: [-1.08, 1.08], y: [-1.25, 1.25], height: 170, full: true, yticks: [], title: 'the leftover $=$ target $-$ best approximation (rescaled)' });
        const xs = M.linspace(-1, 1, 241);
        const q = (x) => 0.9 * x ** 5 - 1.1 * x ** 3 + 0.35 * x * x + 0.3 * x - 0.1;
        let st = null;
        v.legend([['red', 'target'], ['blue', 'best approximation from the span', { dash: true }], ['gold', 'leftover'], ['gold', 'roots of the leftover', { dot: true }]]);
        v.render(() => {
          const n = N.value, f = tgt.value === 'next' ? (x) => x ** (n + 1) : q;
          const c = M.lstsq(xs.map((x) => Array.from({ length: n + 1 }, (_, j) => x ** j)), xs.map(f));
          const P = (x) => M.polyEval(c, x), res = (x) => f(x) - P(x);
          const rv = xs.map(res), mx = Math.max(...rv.map(Math.abs)), zero = mx < 1e-9;
          top.fn(f, { domain: [-1, 1], color: 'red', width: 2.6 });
          top.fn(P, { domain: [-1, 1], color: 'blue', width: 2.2, dash: [7, 5] });
          if (zero) { bot.hline(0, { color: 'green', width: 3 }); bot.corner('leftover ≡ 0: the target lies in the span', 'tl', { color: 'green', weight: 600 }); }
          else {
            bot.fn((x) => res(x) / mx, { domain: [-1, 1], color: 'gold', width: 2.4 });
            const roots = [];
            for (let i = 0; i + 1 < xs.length; i++) if (rv[i] === 0 || rv[i] * rv[i + 1] < 0) roots.push(rv[i] === 0 ? xs[i] : M.bisect(res, xs[i], xs[i + 1]));
            roots.forEach((x) => bot.dot(x, 0, { r: 4, color: 'gold' }));
            bot.corner(`max |leftover| = ${v.fmt(mx, 3)}  ·  ${roots.length} roots`, 'tl', { color: 'red', weight: 600 });
            st = { n, zero, mx, roots: roots.length };
          }
          if (zero) st = { n, zero, mx };
          top.corner(tgt.value === 'next' ? `target x^${n + 1} — one degree above the list` : 'target q, degree 5', 'tl', { color: 'muted', weight: 600 });
        });
        v.readout(() => {
          if (!st) return '';
          const { n, zero, mx, roots } = st;
          if (zero) return `$q\\in\\operatorname{span}(1,x,\\dots,x^{${n}})$: the leftover vanishes identically. Enlarging the list captures any *fixed* polynomial — but then $x^{${n + 1}}$ is outside the new span.`;
          const head = tgt.value === 'next' ? `Every combination of $1,\\dots,x^{${n}}$ has degree $\\le ${n}$, so $x^{${n + 1}}$ is not in the span` : `$q$ has degree $5 > ${n}$, so it is not in the span yet`;
          return `${head}: the leftover is a nonzero polynomial (max $${v.fmt(mx, 3)}$ on $[-1,1]$, ${roots} sign changes). No finite list spans $\\mathcal P(\\mathbf R)$ — unlike $\\mathbf R^3$, where $e_1,e_2,e_3$ already span.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Definition',
      name: 'Polynomials 𝒫(F)',
      statement: String.raw`A function $p\colon\mathbf F\to\mathbf F$ is a *polynomial* with coefficients in $\mathbf F$ if there exist $m\ge0$ and $a_0,\dots,a_m\in\mathbf F$ such that
$$p(z)=a_0+a_1z+a_2z^2+\dots+a_mz^m\quad\text{for all }z\in\mathbf F.$$
The set of all polynomials with coefficients in $\mathbf F$ is denoted $\mathcal P(\mathbf F)$. With the usual pointwise addition and scalar multiplication of functions, $\mathcal P(\mathbf F)$ is a vector space over $\mathbf F$ — a subspace of the space $\mathbf F^{\mathbf F}$ of all functions from $\mathbf F$ to $\mathbf F$.`,
      idea: String.raw`The zero function is a polynomial, and adding or scaling polynomials adds or scales their coefficient lists, so the result is again a polynomial; by the subspace test 1.34, $\mathcal P(\mathbf F)$ is a subspace of $\mathbf F^{\mathbf F}$. Because the operations act coefficientwise, the polynomials of degree at most $m$ behave exactly like coefficient vectors in $\mathbf F^{m+1}$ — the source of the bases $1,z,\dots,z^m$ used throughout the book.`,
      caption: String.raw`On the right, drag the coefficient points $p=(a_0,a_1,a_2)$ and $q$ of two quadratics (drag the background to rotate), and set $\lambda$. On the left, their graphs. The green graph of $\lambda p+q$ is the pointwise sum of the graphs, and its coefficient point is the corresponding corner of the parallelogram. Drag the gold marker $x_0$ to compare values.`,
      deps: ['ladr-1.20', 'ladr-1.34'],
      tags: ['polynomials'],
      viz(v) {
        const L = v.stage({ x: [-1.6, 1.6], y: [-3, 3], height: 340, minWidth: 300, xlabel: 'x', title: 'graphs: functions $\\mathbf R\\to\\mathbf R$' });
        const G = scene3(v, { height: 340, range: 2.3, labels: ['a₀', 'a₁', 'a₂'], title: 'coefficient points $(a_0,a_1,a_2)$', minWidth: 280, ball: 1.7, hint: false });
        const lam = v.slider('$\\lambda$', -1.5, 1.5, 0.8, { step: 0.05 });
        const q10 = (p) => p.map((c) => Math.round(c * 10) / 10);
        const hp = G.handle([1.2, -0.3, 0.9], { color: 'blue', constrain: q10 });
        const hq = G.handle([-0.4, -1.1, -0.5], { color: 'orange', constrain: q10 });
        const x0 = L.handle(0.9, 0, { color: 'gold', constrain: (x) => [Math.max(-1.5, Math.min(1.5, x)), 0] });
        const ev = (c, x) => c[0] + c[1] * x + c[2] * x * x;
        const polyTeX = (c) => { let s = ''; [[c[0], ''], [c[1], 'x'], [c[2], 'x^2']].forEach(([a, m]) => { if (Math.abs(a) < 0.005) return; const t = Math.abs(a).toFixed(2); s += (s ? (a < 0 ? ' - ' : ' + ') : a < 0 ? '-' : '') + (m && t === '1.00' ? '' : t) + m; }); return s || '0'; };
        let st = null;
        v.legend([['blue', '$p$'], ['orange', '$q$'], ['green', '$\\lambda p+q$']]);
        G.render(() => {
          const p = hp.p, q = hq.p, l = lam.value, lp = mul3(p, l), r = add3(lp, q);
          G.line(lp, r, { color: 'muted', width: 1, dash: [4, 4] }); G.line(q, r, { color: 'muted', width: 1, dash: [4, 4] });
          G.poly([ZERO, lp, r, q], { fill: 'green', fillAlpha: 0.08, stroke: false, occlude: false });
          G.vec(lp, { color: 'blue', width: 1.8, dash: [6, 4], label: '\\lambda p', off: 14, at: 0.55 });
          G.vec(p, { color: 'blue', label: 'p', width: 2.6 }); G.vec(q, { color: 'orange', label: 'q', width: 2.6 });
          G.vec(r, { color: 'green', label: '\\lambda p+q', width: 3, off: 26 });
          G.corner('drag the background to rotate', 'br', { color: 'faint', size: 10.5 });
          st = { p, q, r, l };
        });
        v.render(() => {
          if (!st) return;
          const { p, q, r, l } = st, X = x0.x;
          let Y = 1.5; for (let x = -1.6; x <= 1.6; x += 0.05) Y = Math.max(Y, Math.abs(ev(p, x)), Math.abs(ev(q, x)), Math.abs(ev(r, x)), Math.abs(l * ev(p, x)));
          L.setView(null, [-Y * 1.12, Y * 1.12]);
          L.fn((x) => ev(p, x), { color: 'blue', width: 2 }); L.fn((x) => ev(q, x), { color: 'orange', width: 2 });
          L.fn((x) => ev(r, x), { color: 'green', width: 3 });
          const a = l * ev(p, X), b = ev(q, X);
          L.vline(X, { color: 'gold', dash: [3, 4], width: 1 });
          L.arrow(X - 0.04, 0, X - 0.04, a, { color: 'blue', width: 2.2, head: 7 });
          L.arrow(X + 0.04, a, X + 0.04, a + b, { color: 'orange', width: 2.2, head: 7 });
          L.dot(X, a + b, { r: 5, color: 'green' });
        });
        v.readout(() => {
          if (!st) return '';
          const { p, q, r, l } = st, X = x0.x, a = l * ev(p, X), b = ev(q, X);
          return `$p(x) = ${polyTeX(p)}$, $\\;q(x) = ${polyTeX(q)}$, $\\;(\\lambda p+q)(x) = ${polyTeX(r)}$ — coefficients combine like vectors in $\\mathbf R^3$. At $x_0 = ${v.fix(X, 2)}$: $\\lambda p(x_0)+q(x_0) = ${v.fix(a, 3)} + (${v.fix(b, 3)}) = ${v.fix(a + b, 3)} = (\\lambda p+q)(x_0)$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.15
    {
      num: '2.15',
      kind: 'Definition',
      name: 'Linearly independent list',
      statement: String.raw`A list $v_1,\dots,v_m$ of vectors in $V$ is *linearly independent* if the only choice of $a_1,\dots,a_m\in\mathbf F$ with
$$a_1v_1+\dots+a_mv_m=0$$
is $a_1=\dots=a_m=0$. The empty list $(\,)$ is also declared to be linearly independent.`,
      idea: String.raw`Independence is uniqueness of representation: if some $v\in\spn(v_1,\dots,v_m)$ had two representations, subtracting them would give a nontrivial combination equal to $0$, and conversely. In $\mathbf R^3$, three vectors are independent exactly when the parallelepiped they span has positive volume (none of them lies in the plane or line spanned by the others); two are independent when their parallelogram has positive area, one when it is not $0$.`,
      caption: String.raw`Drag the tips (drag the background to rotate). The app solves $a_1v_1+a_2v_2+a_3v_3=0$. While the shaded parallelepiped has positive volume the only solution is $a=0$. Push $v_3$ toward the plane of $v_1,v_2$ — it snaps in, the volume collapses to $0$, and a nontrivial solution appears as a closed gold loop $a_1v_1\to a_2v_2\to a_3v_3$ that returns to the origin. With one vector, drag it to $0$.`,
      deps: ['ladr-2.4'],
      tags: ['independence'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Linear_independence' },
      viz(v) {
        const M = v.M;
        const G = scene3(v, { height: 400 });
        const m = v.select('list', [{ value: '1', label: '$v_1$' }, { value: '2', label: '$v_1,v_2$' }, { value: '3', label: '$v_1,v_2,v_3$' }], '3');
        const H = [];
        [[1.35, 0.1, 0.2], [0.25, 1.3, 0.25], [0.3, 0.45, 1.25]].forEach((p, i) => H.push(G.handle(p, {
          color: VC[i],
          constrain: (q) => {
            const others = H.filter((h, j) => j !== i && j < +m.value).map((h) => h.p);
            return others.length ? snapInto(q, orth(others), 0.16) : len3(q) < 0.16 ? ZERO.slice() : q;
          },
        })));
        let st = null;
        v.legend([['accent', 'parallelepiped spanned by the list', { area: true }], ['gold', 'a nontrivial solution, tip to tail']]);
        G.render(() => {
          const k = +m.value; H.forEach((h, i) => { h.visible = i < k; });
          const vs = H.slice(0, k).map((h) => h.p);
          let size;
          if (k === 3) { parallelepiped(G, vs[0], vs[1], vs[2], { color: 'accent' }); size = Math.abs(det3(vs[0], vs[1], vs[2])); }
          else if (k === 2) { G.poly([ZERO, vs[0], add3(vs[0], vs[1]), vs[1]], { fill: 'accent', fillAlpha: 0.18, color: 'accent' }); size = len3(cross(vs[0], vs[1])); }
          else size = len3(vs[0]);
          const ns = M.nullspace([0, 1, 2].map((r) => vs.map((w) => w[r])), 1e-9);
          let a = null;
          if (ns.length) {
            a = ns[0]; const mx = Math.max(...a.map(Math.abs)); a = a.map((x) => x / mx);
            let s = ZERO;
            for (let i = 0; i < k; i++) { const nx = add3(s, mul3(vs[i], a[i])); if (Math.abs(a[i]) > 1e-9) G.arrow(s, nx, { color: 'gold', width: 3.4, head: 11 }); s = nx; }
            G.dot(ZERO, { r: 7, color: 'green', noDim: true });
          }
          vs.forEach((p, i) => G.vec(p, { color: VC[i], label: `v_${i + 1}`, width: 2.6 }));
          S3corner(G, `${['length', 'area', 'volume'][k - 1]} = ${v.fix(size, 3)}`, a ? 'red' : 'green');
          st = { k, a, size };
        });
        v.readout(() => {
          if (!st) return '';
          const { k, a, size } = st, names = Array.from({ length: k }, (_, i) => `v_${i + 1}`);
          const eq = `${names.map((n, i) => `a_${i + 1}${n}`).join('+')}=0`;
          if (!a) return `${['Length', 'Area', 'Volume'][k - 1]} $= ${v.fix(size, 3)} > 0$: the only solution of $${eq}$ is $a = 0$, so $${names.join(',')}$ is **linearly independent**.`;
          return `${['Length', 'Area', 'Volume'][k - 1]} $= 0$: $(${a.map((x) => tn(x)).join(',\\,')})$ is a nontrivial solution of $${eq}$ — the list is **not** linearly independent.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.17
    {
      num: '2.17',
      kind: 'Definition',
      name: 'Linearly dependent list',
      statement: String.raw`A list of vectors in $V$ is *linearly dependent* if it is not linearly independent. In other words, $v_1,\dots,v_m$ is linearly dependent if there exist $a_1,\dots,a_m\in\mathbf F$, not all $0$, such that $a_1v_1+\dots+a_mv_m=0$.`,
      idea: String.raw`A nontrivial relation can be solved for any vector whose coefficient is nonzero, so a dependent list always carries a redundant vector — the linear dependence lemma 2.19 pins down which. Typical causes: the list contains $0$; two vectors are parallel; or there are simply too many vectors, as with any three vectors in $\mathbf R^2$ (a first glimpse of 2.22).`,
      caption: String.raw`Click empty space to add a vector in $\mathbf R^2$ (up to five) and drag the tips; a tip dragged close to the line of another vector snaps onto it, and one dragged near the origin snaps to $0$. As soon as the list is dependent, the gold chain of arrows $a_1v_1,\,a_2v_2,\dots$ laid tip to tail closes up at the origin — a combination with coefficients not all $0$ that equals $0$.`,
      deps: ['ladr-2.15'],
      tags: ['independence'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-3.3, 3.3], y: [-2.3, 2.3], equal: true, height: 380 });
        const START = [[1.7, 0.45], [0.35, 1.45], [-1.5, 0.9], [-0.7, -1.4], [1.3, -1.15]];
        let n = 3;
        const H = START.map((p, i) => S.handle(p[0], p[1], {
          color: VC[i],
          constrain: (x, y) => {
            if (Math.hypot(x, y) < 0.15) return [0, 0];
            for (let j = 0; j < n; j++) if (j !== i) { const s = snapLine2([x, y], [H[j].x, H[j].y], 0.13); if (s[0] !== x || s[1] !== y) return s; }
            return [x, y];
          },
        }));
        S.onClick((x, y) => {
          if (n >= 5) return;
          for (const h of H.slice(0, n)) if (Math.hypot(S.X(h.x) - S.X(x), S.Y(h.y) - S.Y(y)) < 18) return;
          H[n].x = x; H[n].y = y; n++;
        });
        v.button('Remove last', () => { if (n > 1) n--; });
        v.button('Reset', () => { n = 3; START.forEach((p, i) => { H[i].x = p[0]; H[i].y = p[1]; }); });
        let st = null;
        v.legend([['gold', 'a nontrivial combination equal to $0$', { area: true }]]);
        v.render(() => {
          H.forEach((h, i) => { h.visible = i < n; });
          const vs = H.slice(0, n).map((h) => [h.x, h.y]);
          const dep = firstDependent(M, vs.map(to3));
          let coef = null;
          if (dep) {
            coef = vs.map(() => 0); dep.c.forEach((c, j) => { coef[j] = c; }); coef[dep.k] = -1;
            const mx = Math.max(1, ...coef.map(Math.abs)); coef = coef.map((c) => c / mx);
            const pts = [[0, 0]]; let s = [0, 0];
            coef.forEach((c, j) => { if (Math.abs(c) > 1e-9) { s = [s[0] + c * vs[j][0], s[1] + c * vs[j][1]]; pts.push(s); } });
            S.poly(pts, { fill: 'gold', fillAlpha: 0.14, stroke: false });
            for (let i = 0; i + 1 < pts.length; i++) S.arrow(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], { color: 'gold', width: 3.4, head: 11 });
            S.dot(0, 0, { r: 7, color: 'green' });
          }
          vs.forEach((p, i) => vec2(S, [0, 0], p, VC[i], `v_${i + 1}`, { width: 2.4 }));
          S.dot(0, 0, { r: 3, color: 'ink' });
          S.corner(n < 5 ? `${n} vector${n > 1 ? 's' : ''} — click empty space to add` : '5 vectors (the maximum)', 'tl', { color: 'muted', weight: 600 });
          S.corner(dep ? 'linearly dependent' : 'linearly independent', 'tr', { color: dep ? 'red' : 'green', weight: 600 });
          st = { n, dep, coef, vs };
        });
        v.readout(() => {
          if (!st) return '';
          const { n, dep, coef } = st, names = Array.from({ length: n }, (_, i) => `v_${i + 1}`);
          if (!dep) return `Only the trivial combination of $${names.join(',')}$ gives $0$: **independent**. Add a third vector, or make two parallel.`;
          const why = dep.k === 0 ? '$v_1 = 0$, so $1\\cdot v_1 = 0$' : `$v_${dep.k + 1} = ${combTeX(dep.c, names)}$` + (n >= 3 && dep.k >= 2 ? ' (three vectors in $\\mathbf R^2$ always do this)' : '');
          return `${why}, hence $${combTeX(coef, names)} = 0$ with coefficients not all $0$: **linearly dependent**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.19
    {
      num: '2.19',
      kind: 'Lemma',
      name: 'Linear dependence lemma',
      statement: String.raw`Suppose $v_1,\dots,v_m$ is a linearly dependent list in $V$. Then there exists $k\in\{1,2,\dots,m\}$ such that
$$v_k\in\spn(v_1,\dots,v_{k-1}).$$
Furthermore, if $k$ satisfies this condition and the $k$th term is removed from $v_1,\dots,v_m$, then the span of the remaining list equals $\spn(v_1,\dots,v_m)$.

(For $k=1$ the condition reads $v_1\in\spn(\,)=\{0\}$, that is, $v_1=0$.)`,
      idea: String.raw`Take a relation $a_1v_1+\dots+a_mv_m=0$ with not all $a_j=0$, and let $k$ be the largest index with $a_k\neq0$. Dividing by $-a_k$ expresses $v_k$ as a combination of $v_1,\dots,v_{k-1}$. For the second part, substitute that expression for $v_k$ in any linear combination of the whole list: the result is a combination of the remaining vectors, so nothing is lost from the span. (The picture uses the *smallest* such $k$, which also satisfies the condition.)`,
      caption: String.raw`Four vectors in $\mathbf R^3$ are always dependent. Use the slider to add them one at a time and watch the span grow — point, line, plane, space. The first $v_k$ that lands in the span of its predecessors is ringed in red, and the gold path writes it as a combination of them. Switch on *remove $v_k$*: the drawn span does not change. Drag $v_3$ out of the plane of $v_1,v_2$, or $v_2$ onto the line of $v_1$ (tips snap into the span of their predecessors), to change which $k$ is the culprit.`,
      deps: ['ladr-2.17', 'ladr-2.4'],
      tags: ['independence'],
      viz(v) {
        const M = v.M;
        const G = scene3(v, { height: 400 });
        const J = v.slider('show $v_1,\\dots,v_j$, $\\;j=$', 1, 4, 3, { int: true });
        const rem = v.toggle('remove $v_k$', false);
        const P0 = [[1.4, 0.15, 0.1], [0.15, 1.3, 0.35]];
        P0.push(add3(mul3(P0[0], -0.6), mul3(P0[1], 1.05)), [0.6, -0.5, 1.3]);
        const H = [];
        P0.forEach((p, i) => H.push(G.handle(p, { color: VC[i], constrain: (q) => (i === 0 ? (len3(q) < 0.16 ? ZERO.slice() : q) : snapInto(q, orth(H.slice(0, i).map((h) => h.p)), 0.16)) })));
        let st = null;
        v.legend([['accent', '$\\operatorname{span}$ of the vectors shown', { area: true }], ['red', 'first $v_k\\in\\operatorname{span}(v_1,\\dots,v_{k-1})$', { dot: true }], ['gold', 'its expression in $v_1,\\dots,v_{k-1}$', { dash: true }]]);
        G.render(() => {
          const j = J.value, all = H.map((h) => h.p);
          H.forEach((h, i) => { h.visible = i < j; });
          const dep = firstDependent(M, all.slice(0, j)), k = dep ? dep.k : -1, removed = rem.value && k >= 0;
          const keep = all.slice(0, j).filter((_, i) => !(removed && i === k));
          const B = orth(keep), dimAll = orth(all.slice(0, j)).length;
          if (B.length === 2) G.disc(B, { color: 'accent', r: 2.1 }); else G.subspace(B, { color: 'accent', h: 1.35 });
          if (dep && k > 0) {
            let s = ZERO; dep.c.forEach((c, i) => { const nx = add3(s, mul3(all[i], c)); G.arrow(s, nx, { color: 'gold', width: 2.2, dash: [6, 4], head: 9 }); s = nx; });
          }
          for (let i = 0; i < j; i++) {
            if (removed && i === k) G.vec(all[i], { color: VC[i], label: `v_${i + 1}`, width: 1.5, dash: [3, 4], alpha: 0.45, head: 7 });
            else G.vec(all[i], { color: VC[i], label: `v_${i + 1}`, width: 2.7 });
          }
          if (dep) G.dot(all[k], { r: 12, hollow: true, color: 'red', width: 2.6, noDim: true });
          const SH = ['point', 'line', 'plane', 'space'], dims = []; for (let i = 1; i <= j; i++) dims.push(SH[orth(all.slice(0, i)).length]);
          S3corner(G, `span(v₁), span(v₁,v₂), …:  ${dims.join(' → ')}`, 'muted');
          st = { j, dep, dimAll, dimKeep: B.length, removed };
        });
        v.readout(() => {
          if (!st) return '';
          const { j, dep, dimAll, dimKeep, removed } = st, names = Array.from({ length: j }, (_, i) => `v_${i + 1}`);
          if (!dep) return `$${names.join(',')}$ is still linearly independent — no vector lies in the span of its predecessors. Add more vectors.`;
          const k = dep.k + 1;
          const expr = k === 1 ? '$v_1 = 0 \\in \\operatorname{span}(\\,)$' : `$v_${k} = ${combTeX(dep.c, names)} \\in \\operatorname{span}(${names.slice(0, k - 1).join(',')})$`;
          const SH = ['$\\{0\\}$', 'a line', 'a plane', 'all of $\\mathbf R^3$'];
          return `${expr}, so $k=${k}$. The span of $${names.join(',')}$ is ${SH[dimAll]}; ${removed ? `after removing $v_${k}$ it is still ${SH[dimKeep]} — the same set.` : 'switch on *remove* — the span stays the same.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.22
    {
      num: '2.22',
      kind: 'Theorem',
      name: 'Independent list no longer than spanning list',
      statement: String.raw`Suppose $u_1,\ldots,u_m$ are linearly independent in $V$ and $\spn(w_1,\ldots,w_n)=V$, where both lists are finite. Then $m\le n$. This includes empty lists and the zero space.`,
      idea: String.raw`Keep a list of length $n$ that spans $V$ and begins with the $u$'s already inserted. Insert the next $u$ immediately after that prefix. The enlarged list is dependent because the old list spans $V$. By 2.19, some vector belongs to the span of its predecessors and can be deleted without changing the span. That vector cannot be in the independent $u$-prefix, so delete an original $w$. Each insertion therefore consumes a different $w$, giving $m\le n$. If $m=0$ nothing needs doing; if $n=0$, then $V=\{0\}$ and independence forces $m=0$.`,
      caption: String.raw`The model fixes $V=\R^3$. Choose the list lengths, drag vector tips, or rotate the background, then step through each insertion, dependence certificate, and deletion. The initial $W$ must pass a numerical spanning check. Zero or parallel $u$'s expose the actual dependent prefix, even in a list of length two. Four $u$'s in $\R^3$ always fail independence. Near dependence pauses the numerical illustration; the exact theorem has no tolerance.`,
      deps: ['ladr-2.19', 'ladr-2.15', 'ladr-2.9'],
      see: ['pma-9.2'],
      tags: ['independence', 'span'],
      refs: ['Axler, Linear Algebra Done Right, 4e, 2.22 and its proof (printed p.35); 2.19 (pp.33–34).'],
      links: { source: 'https://linear.axler.net/LADR4e.pdf' },
      viz(v) {
        const G = scene3(v, { height: 420, minWidth: 220, range: 3.2, hint: false, axes: false });
        let S, trace, signature = '', st = null;
        const rebuild = () => {
          const W = HW.slice(0, +nSel.value).map(h => h.p), U = HU.slice(0, +mSel.value).map(h => h.p);
          signature = JSON.stringify([nSel.value, mSel.value, ...HW.map(h => h.p), ...HU.map(h => h.p)]);
          trace = exchangeTrace(v.M, W, U);
          if (S) { S.pause(); S.reset(trace.frames.map(describe), { at: 'keep' }); }
        };
        const nSel = v.select('length of W', [3, 4, 5].map(n => ({ value: String(n), label: `$n=${n}$` })), '4', { onChange: rebuild });
        const mSel = v.select('length of U', [2, 3, 4].map(m => ({ value: String(m), label: `$m=${m}$` })), '3', { onChange: rebuild });
        const HW = EXCHANGE_DEFAULT.W.map(p => G.handle(p, { color: 'orange', r: 5.5, onDrag: rebuild }));
        const HU = EXCHANGE_DEFAULT.U.map(p => G.handle(p, { color: 'blue', r: 5.5, onDrag: rebuild }));
        const preset = v.select('starting vectors', EXCHANGE_PRESETS.map(([value, label]) => ({ value, label })), 'valid', { onChange: key => {
          const p = exchangePreset(key); p.W.forEach((x, i) => HW[i].set(x)); p.U.forEach((x, i) => HU[i].set(x)); rebuild(); S.first();
        } });
        const target = v.select('tip to drag', [{ value: 'all', label: 'all tips' }, ...['w', 'u'].flatMap(kind => Array.from({ length: kind === 'w' ? 5 : 4 }, (_, i) => ({ value: kind + (i + 1), label: kind + SUB[i] })))], 'all');
        const name = e => `${e.kind}_{${e.i + 1}}`, text = e => e.kind + SUB[e.i], list = B => B.map(text).join(', ');
        function describe(f) {
          const k = f.k + 1;
          const note = {
            initial: `Fixed ambient space: $V=\\R^3$. Check W first. Its numerical rank is ${trace.wRank.rank ?? 'unresolved'}. U is a candidate list, not an assumed independent input.`,
            nonspanning: `**Spanning check fails:** W has numerical rank ${trace.wRank.rank}, below 3. No insertion is justified in this fixed ambient space. Moving U cannot repair this hypothesis.`,
            uncertain: '**Numerical pause:** a normalized singular value is near the dependence threshold, an input is too small to normalize safely, or no reliable dependence certificate was obtained. No exact conclusion is inferred from this stop.',
            insert: `Step ${k}: insert $u_{${k}}$ after the earlier u's. The previous list spans $\\R^3$, so this enlarged list is dependent. Its length is now ${f.B.length}.`,
            relation: `Lemma 2.19 finds $${f.out ? name(f.out) : ''}$ in the span of its predecessors. The current u-prefix passed the numerical independence check. The gold path shows the computed relation; its coefficients and residual appear below.`,
            remove: `Delete $${f.out ? name(f.out) : ''}$ using that relation. The list returns to length ${+nSel.value}, with the same span. ${f.gone.length} distinct original w's have now been removed.`,
            dependentU: `**Numerical independence check fails:** the first numerically dependent prefix ends at $${f.out ? name(f.out) : ''}$. Its computed relation uses only earlier u's. Stop here; no w is removed for this insertion.${+mSel.value > 3 ? ' Independently, any list of four vectors in $\\R^3$ is dependent.' : ''}`,
            done: `All ${+mSel.value} insertions removed different original w's. The final list still has length ${+nSel.value} and spans $\\R^3$, illustrating $m\\le n$.`,
          }[f.phase];
          return { ...f, line: { initial: 1, nonspanning: 1, uncertain: 5, insert: 3, relation: 4, remove: 6, dependentU: 5, done: 7 }[f.phase], note };
        }
        rebuild();
        S = v.steps({ frames: trace.frames.map(describe), codePos: 'below', start: 0, speed: .9, codeTitle: 'Exchange invariant: same span, length n', code: [
          'check W spans V',
          'for each next u:',
          '  insert u after the previous u-prefix',
          '  find first dependent prefix (2.19)',
          '  if unresolved or dependent U: stop',
          '  delete its last vector, a w',
          'return m ≤ n (distinct w removals)',
        ] });
        for (const line of S.codeEl.querySelectorAll('.ln')) {
          line.style.whiteSpace = 'pre-wrap'; line.lastElementChild.style.minWidth = '0'; line.lastElementChild.style.overflowWrap = 'anywhere';
        }
        v.shareState('exchange vectors and camera', {
          get: () => ({ W: HW.map(h => h.p.slice()), U: HU.map(h => h.p.slice()), preset: preset.value, yaw: Math.atan2(Math.sin(G.yaw), Math.cos(G.yaw)), pitch: G.pitch }),
          validate: validExchangeState,
          set: d => { preset.set(d.preset); d.W.forEach((p, i) => HW[i].set(p)); d.U.forEach((p, i) => HU[i].set(p)); G.yaw = d.yaw; G.pitch = d.pitch; rebuild(); },
        });
        v.legend([['blue', 'candidate U'], ['orange', 'original W'], ['red', 'dependent prefix endpoint', { dot: true }], ['gold', 'computed relation', { dash: true }]]);
        G.render(() => {
          const sig = JSON.stringify([nSel.value, mSel.value, ...HW.map(h => h.p), ...HU.map(h => h.p)]);
          if (sig !== signature) rebuild();
          HW.forEach((h, i) => { h.visible = i < +nSel.value && (target.value === 'all' || target.value === 'w' + (i + 1)); });
          HU.forEach((h, i) => { h.visible = i < +mSel.value && (target.value === 'all' || target.value === 'u' + (i + 1)); });
          const f = S.frame, entries = [...trace.W, ...trace.U], active = new Set(f.B.map(e => e.id));
          const chain = f.dep?.chain || [], pts = [...entries.map(e => e.p), ...chain];
          // Fit the complete certificate, including large intermediate partial sums.
          // A minimum radius leaves room for every label, marker and hover halo.
          const extent = Math.max(2.5, ...pts.flatMap(p => G.P(p).map(Math.abs)));
          const radius = extent * 1.4; G.S.setView([-radius, radius], [-radius, radius]);
          const axes = [0, 1, 2].map(i => { const p = [0, 0, 0]; p[i] = radius * .65; return p; });
          for (const p of axes) G.line(mul3(p, -1), p, { color: 'faint', width: 1 });
          for (const e of entries) G.vec(e.p, { color: e.id === f.out?.id && f.dep ? 'red' : e.kind === 'u' ? 'blue' : 'orange', width: active.has(e.id) ? 2.5 : 1.3, alpha: active.has(e.id) ? 1 : .4, dash: active.has(e.id) ? undefined : [3, 4] });
          for (let i = 1; i < chain.length; i++) G.arrow(chain[i - 1], chain[i], { color: 'gold', width: 2.2, dash: [6, 4], head: 9 });
          if (f.dep && f.out) G.dot(f.out.p, { r: 12, hollow: true, color: 'red', width: 2.4, noDim: true });
          if (f.ins) G.dot(f.ins.p, { r: 11, hollow: true, color: 'gold', width: 2.2, noDim: true });
          // Labels sharing a projected tip form one name group. Place groups in
          // separate rows when necessary; full vector records remain below.
          G.overlay(() => {
            const groups = [];
            for (const e of [...entries, ...axes.map((p, i) => ({ p, axis: ['x', 'y', 'z'][i] }))]) {
              const p = G.P(e.p), x = G.S.X(p[0]), y = G.S.Y(p[1]);
              const g = groups.find(g => Math.hypot(g.x - x, g.y - y) < 12);
              const label = e.axis || text(e);
              if (g) g.names.push(label); else groups.push({ x, y, names: [label] });
            }
            const occupied = [];
            for (const g of groups.sort((a, b) => a.y - b.y)) {
              const label = g.names.join(', ');
              G.S.ctx.save(); G.S.ctx.font = '500 14px Inter, system-ui, sans-serif';
              const w = G.S.ctx.measureText(label).width + 14; G.S.ctx.restore();
              const tips = entries.map(e => { const p = G.P(e.p); return [G.S.X(p[0]), G.S.Y(p[1])]; });
              const candidates = Array.from({ length: Math.ceil(G.S.height / 20) }, (_, i) => [g.y - 24 - i * 20, g.y + 24 + i * 20]).flat();
              const clampX = x => Math.max(w / 2 + 3, Math.min(G.S.width - w / 2 - 3, x));
              const xs = [...new Set([g.x + 18, g.x + 24 + w / 2, g.x - 24 - w / 2, ...Array.from({ length: Math.ceil(G.S.width / 24) }, (_, i) => 16 + i * 24)].map(clampX))];
              let place;
              search: for (const y of candidates) {
                if (y < 16 || y > G.S.height - 32) continue;
                for (const x of xs) {
                  if (occupied.some(o => Math.abs(o.y - y) < 21 && Math.abs(o.x - x) < (o.w + w) / 2)) continue;
                  if (tips.some(([px, py]) => Math.abs(py - y) < 22 && Math.abs(px - x) < w / 2 + 14)) continue;
                  place = { x, y }; break search;
                }
              }
              const { x, y } = place || { x: clampX(g.x + 18), y: 16 };
              if (Math.abs(x - g.x) > 28 || Math.abs(y - g.y) > 34) {
                const end = Math.abs(x - g.x) > w / 2 ? [x + Math.sign(g.x - x) * w / 2, y] : [x, y + Math.sign(g.y - y) * 10];
                G.S.path([G.S.inv(g.x, g.y), G.S.inv(...end)], { color: 'muted', alpha: .4, width: .8 });
              }
              occupied.push({ x, y, w });
              G.S.textPx(label, x, y, { align: 'center', size: 14, color: 'ink' });
            }
            G.S.corner('R³ · drag background to rotate', 'bl', { size: 10.5, color: 'muted' });
          });
          st = { trace, f, radius, rank: exchangeRank(v.M, f.B.map(e => e.p)) };
        });
        const number = x => x === 0 ? '0' : String(+x.toPrecision(6));
        v.readout(() => {
          if (!st) return '';
          const { f, rank, radius } = st, dep = f.dep;
          const rows = [
            `Current B (length ${f.B.length}): ${list(f.B)}. Removed w's: ${f.gone.length ? list(f.gone) : 'none'}.`,
            target.value === 'all' ? 'For overlapping tips, choose one named tip to drag.' : `Drag target: ${target.value}. ${+target.value.slice(1) > +(target.value[0] === 'w' ? nSel.value : mSel.value) ? 'It is outside the chosen list length; increase that length to reveal it.' : 'Only this tip receives vector input; background dragging rotates the view.'}`,
            `Numerical rank of B: ${rank.rank ?? 'unresolved'}${rank.ambiguous ? '–' + (rank.upper ?? '?') + ' (uncertain)' : ''}. ${trace.wRank.rank === 3 && !trace.wRank.ambiguous ? 'Initial W passes the spanning test.' : 'Initial W does not pass the spanning test.'}`,
            'Column-normalized singular-value ratios: ≤1e−12 is treated as dependence; above 1e−7 passes independence. Between them, pause. Relation relative residual must be ≤1e−10. These tests illustrate, rather than prove, exact rank.',
            `All coordinates and coefficients below are rounded to 6 significant digits; replay stores full values. Each tip stays in the radius-2 ball. Fitted view radius: ${number(radius)}.`,
            ...[...trace.W, ...trace.U].map(e => `${text(e)} = (${e.p.map(number).join(', ')})`),
          ];
          if (dep?.c) {
            rows.push(`Computed relation for ${text(f.out || f.B[dep.k])}: sum of the following predecessor terms (≈, not an exact symbolic identity).`);
            dep.c.forEach((c, i) => rows.push(`coefficient of ${text(f.B[i])}: ${number(c)}`));
            if (!dep.c.length) rows.push('Empty predecessor sum = 0.');
            rows.push(`Absolute residual: ${number(dep.residual)}. Relative residual: ${number(dep.relativeResidual)}.`);
          }
          if (f.phase === 'done') rows.push(`Completed: m = ${mSel.value} ≤ ${nSel.value} = n; each of the ${mSel.value} removed w's has a different original index.`);
          return rows.join('\n');
        });
      },
    },
    // ------------------------------------------------------------------ 2.25
    {
      num: '2.25',
      kind: 'Theorem',
      name: 'Finite-dimensional subspaces',
      statement: String.raw`Every subspace of a finite-dimensional vector space is finite-dimensional.`,
      idea: String.raw`Let $U$ be a subspace of $V$ and build a list greedily: if $U=\{0\}$, stop; otherwise pick a nonzero $u_1\in U$. At step $k$, if $U=\spn(u_1,\dots,u_{k-1})$, stop; otherwise pick $u_k\in U$ outside that span. No $u_k$ lies in the span of its predecessors, so by the linear dependence lemma 2.19 the list is always linearly independent, and by 2.22 it can never be longer than a spanning list of $V$. So the process stops — and when it stops, the list spans $U$.`,
      caption: String.raw`Choose $U$. The gold candidate is confined to $U$: drag it (drag the background to rotate) and press *Add* to append it to the list — it is accepted only if it lies outside the current span (shaded blue; a candidate near the span snaps into it and is refused). *Random step* picks a vector of $U$ for you. The list stays independent, so the process must halt within $3$ steps — the length of the spanning list $e_1,e_2,e_3$ of $\mathbf R^3$ — exactly when the span fills $U$.`,
      deps: ['ladr-2.19', 'ladr-2.22', 'ladr-2.9', 'ladr-1.33'],
      tags: ['dimension', 'subspaces'],
      viz(v) {
        const G = scene3(v, { height: 410 });
        const Usel = v.select('subspace $U$', [{ value: '0', label: '$\\{0\\}$' }, { value: '1', label: 'a line' }, { value: '2', label: 'a plane' }, { value: '3', label: '$\\mathbf R^3$' }], '2');
        const UB = { 0: [], 1: orth([[0.8, -0.35, 0.5]]), 2: orth([[1, 0, -0.32], [0, 1, 0.215]]), 3: orth([[1, 0, 0], [0, 1, 0], [0, 0, 1]]) };
        let list = [], msg = '', lastU = null, seed = 3;
        const cand = G.handle([0.9, 0.8, 0.2], { color: 'gold', constrain: (q, f) => snapInto(intoSpan(q, UB[Usel.value], f), orth(list), 0.16) });
        const add = () => {
          const B = orth(list), U = UB[Usel.value];
          if (B.length === U.length) { msg = 'halted: the span already equals U'; return; }
          if (distTo(cand.p, B) < 1e-6 * Math.max(1, len3(cand.p))) { msg = 'refused: the candidate already lies in the span'; return; }
          list.push(cand.p.slice()); msg = `accepted u${SUB[list.length - 1]}`;
          const B2 = orth(list); if (B2.length < U.length) cand.p = randomOutside(U, B2);
        };
        function randomOutside(U, B) {
          const r = v.rng(seed++);
          for (let t = 0; t < 60; t++) { const c = U.map(() => r.uniform(-1.4, 1.4)), p = comb(c, U); if (len3(p) > 0.7 && len3(p) < 1.9 && distTo(p, B) > 0.45) return p; }
          return comb(U.map(() => 1), U);
        }
        v.button('Add the candidate', add);
        v.button('Random step', () => { const U = UB[Usel.value], B = orth(list); if (B.length < U.length) { cand.p = randomOutside(U, B); add(); } else msg = 'halted: the span already equals U'; });
        v.button('Reset', () => { list = []; msg = ''; const U = UB[Usel.value]; if (U.length) cand.p = randomOutside(U, []); });
        let st = null;
        v.legend([['orange', 'the subspace $U$', { area: true }], ['accent', '$\\operatorname{span}(u_1,\\dots,u_k)$', { area: true }], ['gold', 'candidate in $U$']]);
        G.render(() => {
          const key = Usel.value, U = UB[key];
          if (key !== lastU) {
            list = []; msg = ''; cand.p = U.length ? randomOutside(U, []) : ZERO.slice();
            if (lastU === null && U.length === 2) { list.push(cand.p.slice()); cand.p = randomOutside(U, orth(list)); } // open with one vector chosen
            lastU = key;
          }
          cand.visible = U.length > 0;
          const B = orth(list), done = B.length === U.length;
          if (U.length === 3) G.cube(1.35, { color: 'orange' }); else if (U.length === 2) G.disc(U, { color: 'orange', r: 2.25, fillAlpha: 0.08 }); else if (U.length === 1) G.lineSpan(U[0], { color: 'orange', width: 3, len: 2.4 });
          if (B.length === 2) G.disc(B, { color: 'accent', r: 1.6, fillAlpha: 0.2 }); else if (B.length === 1) G.lineSpan(B[0], { color: 'accent', width: 6, len: 1.9, alpha: 0.45 }); else if (B.length === 3) G.cube(1.25, { color: 'accent' });
          list.forEach((p, i) => G.vec(p, { color: VC[i], label: `u_${i + 1}`, width: 2.8 }));
          const inSpan = U.length && distTo(cand.p, B) < 1e-6 * Math.max(1, len3(cand.p));
          if (U.length && !done) { G.vec(cand.p, { color: 'gold', width: 2.2, dash: [6, 4], label: '\\text{candidate}', size: 13, off: 30 }); if (inSpan) G.dot(cand.p, { r: 11, hollow: true, color: 'red', width: 2.4, noDim: true }); }
          G.dot(ZERO, { r: 4, color: 'ink', noDim: true });
          S3corner(G, done ? `halted after ${list.length} step${list.length === 1 ? '' : 's'}: span = U` : `${list.length} vector${list.length === 1 ? '' : 's'} chosen — span ≠ U, keep going`, done ? 'green' : 'muted');
          st = { done, k: list.length, dimU: U.length, inSpan };
        });
        v.readout(() => {
          if (!st) return '';
          const { done, k, dimU, inSpan } = st;
          const names = Array.from({ length: k }, (_, i) => `u_${i + 1}`).join(',');
          const m = msg ? `*${msg}.* ` : '';
          if (dimU === 0) return 'Here $U=\\{0\\}$, so the process stops at once: the empty list spans $\\{0\\}$.';
          if (done) return `${m}The process stopped after ${k} step${k === 1 ? '' : 's'}: $${names}$ spans $U$, so $U$ is finite-dimensional. Each $u_j$ lay outside the span of its predecessors, so the list is independent (2.19), and $${k}\\le 3$ by 2.22.`;
          return `${m}${k ? `$${names}$ is linearly independent but does not span $U$ yet.` : 'The list is empty; its span is $\\{0\\}\\ne U$.'} ${inSpan ? 'The candidate lies in the span — it would be refused; drag it out.' : 'The candidate lies outside the span: add it.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.26
    {
      num: '2.26',
      kind: 'Definition',
      name: 'Basis',
      statement: String.raw`A *basis* of $V$ is a list of vectors in $V$ that is linearly independent and spans $V$.

For example, $e_1,\dots,e_n$ is a basis of $\mathbf F^n$, called the *standard basis*; $(1,2),(3,5)$ is another basis of $\mathbf F^2$; and $1,z,\dots,z^m$ is a basis of $\mathcal P_m(\mathbf F)$.`,
      idea: String.raw`Spanning means every vector can be reached as a combination; independence means no vector is reached in two ways (made precise in 2.28). Together they make the list a coordinate system: the integer combinations of a basis of $\mathbf R^2$ form a — possibly skewed — grid, and every vector has exactly one coordinate pair with respect to it.`,
      caption: String.raw`Drag $v_1$ and $v_2$; the grid lines are the combinations $jv_1+sv_2$ and $sv_1+jv_2$ with $j$ an integer. Drag the gold target $w$: its coordinates $(a_1,a_2)$ with $w=a_1v_1+a_2v_2$ are read off the skewed grid along the dashed path. Drag $v_2$ toward the line of $v_1$ until it snaps: the grid collapses onto a line, the list stops being a basis, and $w$ has no coordinates at all (off the line) or infinitely many (on it).`,
      deps: ['ladr-2.15', 'ladr-2.4'],
      tags: ['bases'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Basis_(linear_algebra)' },
      viz(v) {
        const S = v.stage({ x: [-4, 4], y: [-2.6, 2.6], equal: true, height: 390, axes: false });
        const h1 = S.handle(1.25, 0.3, { color: VC[0] });
        const h2 = S.handle(0.55, 1.05, { color: VC[1], constrain: (x, y) => snapLine2([x, y], [h1.x, h1.y], 0.15) });
        const hw = S.handle(2.35, 1.55, { color: 'gold', constrain: (x, y) => (Math.abs(det2([h1.x, h1.y], [h2.x, h2.y])) < 1e-9 ? snapLine2([x, y], [h1.x, h1.y], 0.15) : [x, y]) });
        let st = null;
        v.legend([['blue', 'lines $jv_1+sv_2$'], ['purple', 'lines $sv_1+jv_2$'], ['gold', '$w=a_1v_1+a_2v_2$', { dash: true }]]);
        v.render(() => {
          const a = [h1.x, h1.y], b = [h2.x, h2.y], w = [hw.x, hw.y], D = det2(a, b);
          S.hline(0, { color: 'faint', width: 1 }); S.vline(0, { color: 'faint', width: 1 });
          if (Math.abs(D) > 1e-9) {
            // the skewed grid: lines j·a + s·b and s·a + j·b
            const { x, y } = S.bounds, cs = [[x[0], y[0]], [x[1], y[0]], [x[0], y[1]], [x[1], y[1]]].map((c) => [det2(c, b) / D, det2(a, c) / D]);
            const r0 = [Math.floor(Math.min(...cs.map((c) => c[0]))), Math.ceil(Math.max(...cs.map((c) => c[0])))], r1 = [Math.floor(Math.min(...cs.map((c) => c[1]))), Math.ceil(Math.max(...cs.map((c) => c[1])))];
            if (r0[1] - r0[0] < 80 && r1[1] - r1[0] < 80) {
              for (let j = r0[0]; j <= r0[1]; j++) S.line(j * a[0] + r1[0] * b[0], j * a[1] + r1[0] * b[1], j * a[0] + r1[1] * b[0], j * a[1] + r1[1] * b[1], { color: 'purple', width: j === 0 ? 1.6 : 1, alpha: j === 0 ? 0.6 : 0.28 });
              for (let j = r1[0]; j <= r1[1]; j++) S.line(r0[0] * a[0] + j * b[0], r0[0] * a[1] + j * b[1], r0[1] * a[0] + j * b[0], r0[1] * a[1] + j * b[1], { color: 'blue', width: j === 0 ? 1.6 : 1, alpha: j === 0 ? 0.6 : 0.28 });
            }
            S.poly([[0, 0], a, [a[0] + b[0], a[1] + b[1]], b], { fill: 'accent', fillAlpha: 0.12, stroke: false });
            const c1 = det2(w, b) / D, c2 = det2(a, w) / D, f1 = Math.floor(c1), f2 = Math.floor(c2);
            const cell = [[f1, f2], [f1 + 1, f2], [f1 + 1, f2 + 1], [f1, f2 + 1]].map(([s, t]) => [s * a[0] + t * b[0], s * a[1] + t * b[1]]);
            S.poly(cell, { fill: 'gold', fillAlpha: 0.12, stroke: false });
            const m = [c1 * a[0], c1 * a[1]];
            S.arrow(0, 0, m[0], m[1], { color: 'blue', width: 2.2, dash: [6, 4], head: 9 });
            S.arrow(m[0], m[1], w[0], w[1], { color: 'purple', width: 2.2, dash: [6, 4], head: 9 });
            S.tex(`(a_1,a_2) = (${tn(c1)},\\,${tn(c2)})`, w[0], w[1], { color: 'gold', dx: 12, dy: -16, align: 'left', size: 14 });
            st = { ok: true, c1, c2, w };
          } else {
            const u = Math.hypot(...a) > 1e-9 ? a : [1, 0], L = Math.hypot(...u);
            S.line(-6 * u[0] / L, -6 * u[1] / L, 6 * u[0] / L, 6 * u[1] / L, { color: 'accent', width: 5, alpha: 0.35 });
            const t = (w[0] * u[0] + w[1] * u[1]) / (L * L), p = [t * u[0], t * u[1]], off = Math.hypot(w[0] - p[0], w[1] - p[1]);
            if (off > 1e-6) { S.line(p[0], p[1], w[0], w[1], { color: 'red', width: 2.2, dash: [4, 4] }); S.corner('w is off the line: no coordinates', 'tr', { color: 'red', weight: 600 }); }
            else {
              const k = Math.hypot(...b) / L * Math.sign(b[0] * u[0] + b[1] * u[1] || 1);
              for (const [s1, col] of [[t, 'blue'], [t * 0.35, 'teal'], [-0.4, 'pink']]) { const s2 = (t - s1) / (k || 1); const m = [s1 * a[0], s1 * a[1]]; S.arrow(0, 0, m[0], m[1], { color: col, width: 2, dash: [6, 4], head: 8 }); S.arrow(m[0], m[1], m[0] + s2 * b[0], m[1] + s2 * b[1], { color: col, width: 2, dash: [2, 3], head: 8 }); }
              S.corner('w on the line: infinitely many coordinate pairs', 'tr', { color: 'red', weight: 600 });
            }
            st = { ok: false, off, w };
          }
          vec2(S, [0, 0], a, VC[0], 'v_1', { width: 3 }); vec2(S, [0, 0], b, VC[1], 'v_2', { width: 3 });
          S.tex('w', w[0], w[1], { color: 'gold', dx: -12, dy: 12 });
          S.corner(Math.abs(D) > 1e-9 ? 'v₁, v₂ is a basis of ℝ²' : 'v₁, v₂ is not a basis', 'tl', { color: Math.abs(D) > 1e-9 ? 'green' : 'red', weight: 600 });
        });
        v.readout(() => {
          if (!st) return '';
          if (st.ok) return `$w = (${tn(st.w[0])},\\,${tn(st.w[1])})$ in standard coordinates; in the basis $v_1,v_2$ it is $w = ${tn(st.c1)}\\,v_1 ${st.c2 < 0 ? '-' : '+'} ${tn(Math.abs(st.c2))}\\,v_2$, and no other pair works.`;
          return st.off > 1e-6 ? `$v_2$ is a multiple of $v_1$, so the list spans only a line; $w$ is at distance $${v.fix(st.off, 3)}$ from it and is **not** a combination of $v_1,v_2$.` : '$w$ lies on the line, so it is a combination of $v_1, v_2$ — in infinitely many ways (three are drawn): the list is not independent.';
        });
      },
    },
    // ------------------------------------------------------------------ 2.28
    {
      num: '2.28',
      kind: 'Theorem',
      name: 'Criterion for basis',
      statement: String.raw`A list $v_1,\dots,v_n$ of vectors in $V$ is a basis of $V$ if and only if every $v\in V$ can be written uniquely in the form
$$v=a_1v_1+\dots+a_nv_n,$$
where $a_1,\dots,a_n\in\mathbf F$.`,
      idea: String.raw`If the list is a basis, spanning gives at least one representation of each $v$, and two representations $\sum a_kv_k=\sum c_kv_k$ subtract to $\sum(a_k-c_k)v_k=0$, which independence forces to be trivial. Conversely, existence of a representation for every $v$ is spanning, and uniqueness for $v=0$ (which has the representation with all coefficients $0$) is exactly linear independence.`,
      caption: String.raw`Choose a list in $\mathbf R^2$, then drag the vectors and the gold target $v$. Every solution $(a_1,\dots,a_n)$ of $a_1v_1+\dots+a_nv_n=v$ is drawn as a tip-to-tail path ending at $v$. Two independent vectors: exactly one path. Three vectors: a whole family of paths (the slider $t$ runs along it). One vector, or two parallel ones (they snap): typically no path reaches $v$, and the red gap shows what is missing.`,
      deps: ['ladr-2.26'],
      tags: ['bases'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-4, 4], y: [-2.6, 2.6], equal: true, height: 390 });
        const Lsel = v.select('list', [{ value: '1', label: '$v_1$' }, { value: '2', label: '$v_1,v_2$' }, { value: '3', label: '$v_1,v_2,v_3$' }], '3');
        const T = v.slider('free parameter $t$', -2, 2, 0.6, { step: 0.02 });
        const H = [];
        [[1.5, 0.35], [0.3, 1.15], [-1.3, 0.75]].forEach((p, i) => H.push(S.handle(p[0], p[1], {
          color: VC[i],
          constrain: (x, y) => { for (let j = 0; j < +Lsel.value; j++) if (j !== i) { const s = snapLine2([x, y], [H[j].x, H[j].y], 0.14); if (s[0] !== x || s[1] !== y) return s; } return [x, y]; },
        })));
        const hv = S.handle(2.2, 1.45, { color: 'gold', constrain: (x, y) => { const vs = H.slice(0, +Lsel.value).map((h) => [h.x, h.y]); const B = orth(vs.map(to3)); return B.length === 1 ? snapLine2([x, y], [B[0][0], B[0][1]], 0.15) : [x, y]; } });
        let st = null;
        const pathOf = (a, vs, st0) => { let s = [0, 0]; a.forEach((c, j) => { const n = [s[0] + c * vs[j][0], s[1] + c * vs[j][1]]; S.arrow(s[0], s[1], n[0], n[1], { color: st0.color || VC[j], width: st0.width ?? 2.4, head: st0.head ?? 9, alpha: st0.alpha, dash: st0.dash }); s = n; }); return s; };
        v.legend([['gold', 'target $v$', { dot: true }], ['blue', 'a solution, drawn as $a_1v_1\\to a_2v_2\\to\\cdots$'], ['red', 'unreachable gap', { dash: true }]]);
        v.render(() => {
          const n = +Lsel.value; H.forEach((h, i) => { h.visible = i < n; });
          const vs = H.slice(0, n).map((h) => [h.x, h.y]), tv = [hv.x, hv.y];
          const A = [vs.map((p) => p[0]), vs.map((p) => p[1])];
          const ap = M.lstsq(A, tv), reach = M.matVec(A, ap), gap = Math.hypot(reach[0] - tv[0], reach[1] - tv[1]);
          const N = M.nullspace(A, 1e-9), rank = orth(vs.map(to3)).length;
          const kind = gap > 1e-7 ? 'none' : N.length ? 'many' : 'one';
          T.el.hidden = kind !== 'many';
          if (rank === 1) { const u = orth(vs.map(to3))[0]; S.line(-6 * u[0], -6 * u[1], 6 * u[0], 6 * u[1], { color: 'accent', width: 4, alpha: 0.25 }); }
          let a = ap;
          if (kind === 'none') {
            pathOf(ap, vs, { color: 'muted', alpha: 0.6, dash: [5, 4], width: 2 });
            S.line(reach[0], reach[1], tv[0], tv[1], { color: 'red', width: 2.4, dash: [4, 4] });
            S.dot(reach[0], reach[1], { r: 4, color: 'muted' });
          } else if (kind === 'many') {
            const d = N[0].map((x) => x * 1.1);
            for (const t of M.linspace(-2, 2, 13)) pathOf(ap.map((c, j) => c + t * d[j]), vs, { color: 'gold', alpha: 0.28, width: 1.3, head: 6 });
            a = ap.map((c, j) => c + T.value * d[j]);
            pathOf(a, vs, { width: 3 });
          } else pathOf(ap, vs, { width: 3 });
          vs.forEach((p, i) => vec2(S, [0, 0], p, VC[i], `v_${i + 1}`, { width: 2.4, alpha: 0.85 }));
          S.dot(tv[0], tv[1], { r: 3, color: 'gold' }); S.tex('v', tv[0], tv[1], { color: 'gold', dx: 13, dy: -12 });
          S.corner({ none: 'no solution', one: 'exactly one solution', many: 'infinitely many solutions' }[kind], 'tl', { color: kind === 'one' ? 'green' : 'red', weight: 600 });
          S.corner(n === 2 && rank === 2 ? 'basis of ℝ²' : 'not a basis of ℝ²', 'tr', { color: n === 2 && rank === 2 ? 'green' : 'red', weight: 600 });
          st = { kind, a, ap, N, n, rank, gap };
        });
        v.readout(() => {
          if (!st) return '';
          const { kind, a, N, n, rank, gap } = st;
          const vecS = (x) => `(${x.map((c) => tn(c)).join(',\\,')})`;
          if (kind === 'one') return `Exactly one solution, $(a_1,a_2) = ${vecS(a)}$, for this and every other $v$: $v_1,v_2$ is a basis.`;
          if (kind === 'none') return `No coefficients work: the closest reachable vector misses $v$ by $${v.fix(gap, 3)}$. The list does not span $\\mathbf R^2$${n === 2 ? ' (its vectors are parallel)' : ''}, so it is not a basis.`;
          return `Infinitely many solutions — a ${N.length === 1 ? 'line' : 'plane'} of them in $\\mathbf R^${n}$; at $t = ${v.fix(T.value, 2)}$ the coefficients are $${vecS(a)}$. ${n === 3 ? 'Three vectors in $\\mathbf R^2$ span but are dependent' : 'The vectors are parallel'}, so the representation is not unique and the list is not a basis.`;
        });
      },
    },
  ],
};

/** Status line in the top-left corner of a scene. */
function S3corner(G, text, color = 'muted') { G.corner(text, 'tl', { color, weight: 600 }); }
