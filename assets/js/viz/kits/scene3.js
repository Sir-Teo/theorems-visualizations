// v.scene3(stage, opts): a rotatable 3D scene drawn on an ordinary 2D stage, so that points in ℝ³ can
// carry draggable handles (free, constrained to a plane through 0, or to a line through 0).
// Extracted from the LADR chapters, where it was first written. See docs/kits.md.
//
//   const S = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false });
//   const sc = v.scene3(S, { yaw: -0.6, pitch: 0.35, axis: 1.5, lim: 1.45, labels: ['x', 'y', 'z'] });
//   const u = sc.handle([1, 0.5, 0.2], { color: 'accent', label: 'u' });        // free
//   const w = sc.handle([0, 1, 0], { mode: 'plane', a: [1, 0, 0], b: [0, 1, 0] }); // stays in the xy-plane
//   v.render(() => { sc.begin(); sc.arrow([0, 0, 0], u.p, { color: 'accent' }); sc.flush(); });
//
// Drawing (queued, depth-sorted, then drawn by flush): line, path, poly, disc, arrow, dot, dots, tex, axes.
// Handles expose h.p (the 3D point), h.set(p), and for 'line' mode h.t (the parameter along d).
/**
 * A rotatable 3D picture drawn on a 2D stage, so that vectors in ℝ³ can carry draggable handles
 * (the runtime's stage3d has none). Orthographic view, yaw about the vertical axis then pitch, like stage3d;
 * painter's algorithm: fills and line pieces sorted by depth, then arrows/dots on top. Drag the background to rotate.
 * Handles: mode 'free' (moves parallel to the screen), 'plane' (stays in span{a, b}), 'line' (stays on span{d}).
 */
export function scene3(v, rt, S, o = {}) {
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
