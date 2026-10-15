// Visual Art & Color — Chapter 1 (linear perspective): helpers shared by ch01.js and ch01-b.js.
//
// World axes everywhere in this chapter: x to the right, y forward (depth, away from the viewer), z up —
// the same axes as v.scene3. A picture is the plane at distance d in front of the eye; picture coordinates
// (u, v) are measured on that plane from the principal point (the foot of the perpendicular from the eye).

const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/**
 * A pinhole camera: eye E, looking along (yaw, pitch) (yaw turns right, pitch tilts up), picture plane at distance d.
 * C.cam(P) → [right, depth, up] in camera axes; C.proj(P) → [u, v, depth] or null behind the eye;
 * C.vp(D) → vanishing point [u, v] of the direction D (null if D is parallel to the picture plane);
 * C.seg(P, Q) → the projected segment [[u, v], [u, v]] clipped to the half-space in front of the eye (or null).
 */
export function camera(E, o = {}) {
  const yaw = o.yaw || 0, pitch = o.pitch || 0, d = o.d ?? 1, near = o.near ?? 0.02;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const f = [sy * cp, cy * cp, sp], r = [cy, -sy, 0], u = [-sy * sp, -cy * sp, cp];
  const C = { E, d, f, r, u, yaw, pitch };
  C.cam = (P) => { const q = sub3(P, E); return [dot3(q, r), dot3(q, f), dot3(q, u)]; };
  C.proj = (P) => { const c = C.cam(P); return c[1] > 1e-9 ? [(d * c[0]) / c[1], (d * c[2]) / c[1], c[1]] : null; };
  C.vp = (D) => { const c = [dot3(D, r), dot3(D, f), dot3(D, u)]; return Math.abs(c[1]) < 1e-9 ? null : [(d * c[0]) / c[1], (d * c[2]) / c[1]]; };
  C.seg = (P, Q) => {
    let a = C.cam(P), b = C.cam(Q);
    if (a[1] < near && b[1] < near) return null;
    if (a[1] < near) { const t = (near - a[1]) / (b[1] - a[1]); a = a.map((x, i) => x + t * (b[i] - x)); }
    else if (b[1] < near) { const t = (near - b[1]) / (a[1] - b[1]); b = b.map((x, i) => x + t * (a[i] - x)); }
    return [[(d * a[0]) / a[1], (d * a[2]) / a[1]], [(d * b[0]) / b[1], (d * b[2]) / b[1]]];
  };
  /** Ground point (z = g) seen at picture point (u, v), or null if that ray never reaches the ground. */
  C.ground = (pu, pv, g = 0) => {
    const D = [0, 1, 2].map((i) => pu * r[i] + d * f[i] + pv * u[i]);
    if (Math.abs(D[2]) < 1e-12) return null; const t = (g - E[2]) / D[2]; if (t <= 0) return null;
    return [E[0] + t * D[0], E[1] + t * D[1], g];
  };
  return C;
}

/** Draw the 3D segment PQ through camera C on stage S (clipped at the eye). */
export function seg3(S, C, P, Q, st) { const s = C.seg(P, Q); if (s) S.line(s[0][0], s[0][1], s[1][0], s[1][1], st); return s; }

/** Axis-aligned or turned box: base centre c (its bottom face at height c[2]), size [w, depth, h], turned by yaw about the vertical. */
export function boxMesh(c, [w, dp, h], yaw = 0) {
  const cs = Math.cos(yaw), sn = Math.sin(yaw), V = [];
  for (const z of [0, h]) for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const x = (a * w) / 2, y = (b * dp) / 2;
    V.push([c[0] + x * cs + y * sn, c[1] - x * sn + y * cs, c[2] + z]);
  }
  const F = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]; // outward (counter-clockwise from outside)
  const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  return { V, F, E, c, size: [w, dp, h], yaw };
}

/** House: a box with a gable roof (ridge along the box's depth axis), roof height rh above the walls. */
export function houseMesh(c, [w, dp, h], rh, yaw = 0) {
  const m = boxMesh(c, [w, dp, h], yaw);
  const cs = Math.cos(yaw), sn = Math.sin(yaw);
  const ridge = [-1, 1].map((b) => { const y = (b * dp) / 2; return [c[0] + y * sn, c[1] + y * cs, c[2] + h + rh]; });
  const V = [...m.V, ridge[0], ridge[1]]; // 8 = front ridge end, 9 = back ridge end
  const F = [[0, 3, 2, 1], [0, 1, 5, 8, 4], [2, 3, 7, 9, 6], [1, 2, 6, 5], [3, 0, 4, 7], [5, 6, 9, 8], [4, 8, 9, 7]];
  const E = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 5], [2, 6], [3, 7], [4, 7], [5, 6], [4, 8], [5, 8], [6, 9], [7, 9], [8, 9]];
  return { V, F, E, c, yaw, roof: [[4, 8], [5, 8], [6, 9], [7, 9]] };
}

const faceNormal = (V, f) => {
  const a = V[f[0]], b = V[f[1]], c = V[f[2]];
  const u = sub3(b, a), w = sub3(c, a);
  return [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
};

/**
 * Draw convex solids as opaque shaded faces (back faces culled, solids sorted far to near).
 * map(P) → [x, y] stage point or null (e.g. P => C.proj(P)); eye = the centre of projection (for culling).
 * solids: [{mesh, color, alpha?, width?}]. Faces are outward when listed counter-clockwise seen from outside.
 */
export function drawSolids(S, map, eye, solids, o = {}) {
  const L = o.light || [-0.45, -0.6, 0.66];
  const dist = (m) => { const c = m.V.reduce((s, p) => [s[0] + p[0], s[1] + p[1], s[2] + p[2]], [0, 0, 0]).map((x) => x / m.V.length); return Math.hypot(...sub3(c, eye)); };
  const list = solids.filter((s) => s && s.mesh).map((s) => ({ ...s, dd: dist(s.mesh) })).sort((a, b) => b.dd - a.dd);
  for (const s of list) {
    const { V, F } = s.mesh;
    for (const f of F) {
      const n = faceNormal(V, f), c = f.reduce((acc, i) => [acc[0] + V[i][0], acc[1] + V[i][1], acc[2] + V[i][2]], [0, 0, 0]).map((x) => x / f.length);
      if (dot3(sub3(c, eye), n) >= 0) continue; // back face
      const pts = f.map((i) => map(V[i]));
      if (pts.some((p) => !p)) continue;
      const nn = Math.hypot(...n) || 1, lit = Math.max(0, dot3(n, L) / nn);
      const col = s.color || 'accent';
      S.poly(pts, { fill: 'panel', fillAlpha: 1, stroke: false });
      S.poly(pts, { fill: col, fillAlpha: (s.alpha ?? 0.1) + 0.22 * (1 - lit), color: col, width: s.width ?? 1.5 });
    }
  }
}

/** Intersection of the 2D lines p1p2 and p3p4 (null if parallel). */
export function meet(p1, p2, p3, p4) {
  const d = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]);
  if (Math.abs(d) < 1e-12) return null;
  const a = p1[0] * p2[1] - p1[1] * p2[0], b = p3[0] * p4[1] - p3[1] * p4[0];
  return [(a * (p3[0] - p4[0]) - (p1[0] - p2[0]) * b) / d, (a * (p3[1] - p4[1]) - (p1[1] - p2[1]) * b) / d];
}

/** Distance from point p to the infinite line through a and b. */
export function lineDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  return Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / L;
}

/** Ground-plane tile grid lines (x from x0 to x1, y from y0 to y1, step s), as 3D segments at height g. */
export function gridLines(x0, x1, y0, y1, s = 1, g = 0) {
  const L = [];
  for (let x = x0; x <= x1 + 1e-9; x += s) L.push([[x, y0, g], [x, y1, g]]);
  for (let y = y0; y <= y1 + 1e-9; y += s) L.push([[x0, y, g], [x1, y, g]]);
  return L;
}

/** A standing figure (schematic): foot point F on the ground, height h. Projected through map(P) → [x, y]. */
export function drawFigure(S, map, F, h, st = {}) {
  const foot = map(F), head = map([F[0], F[1], F[2] + h]);
  if (!foot || !head) return;
  const H = head[1] - foot[1], w = H * 0.13, hr = H * 0.075, col = st.color || 'ink';
  const neck = foot[1] + H * 0.84;
  S.poly([[foot[0] - w * 0.55, foot[1]], [foot[0] + w * 0.55, foot[1]], [foot[0] + w, neck - H * 0.3], [foot[0] + w * 0.75, neck], [foot[0] - w * 0.75, neck], [foot[0] - w, neck - H * 0.3]],
    { fill: col, fillAlpha: st.alpha ?? 0.55, stroke: false });
  S.circle(foot[0], neck + hr * 1.05, hr, { fill: col, fillAlpha: st.alpha ?? 0.55, stroke: false });
}

/** Clip the 2D segment ab to the rectangle [x0, x1] × [y0, y1] (Liang–Barsky); returns [a', b'] or null. */
export function clipSeg2(a, b, [x0, x1], [y0, y1]) {
  let t0 = 0, t1 = 1; const dx = b[0] - a[0], dy = b[1] - a[1];
  for (const [p, q] of [[-dx, a[0] - x0], [dx, x1 - a[0]], [-dy, a[1] - y0], [dy, y1 - a[1]]]) {
    if (Math.abs(p) < 1e-15) { if (q < 0) return null; continue; }
    const r = q / p; if (p < 0) { if (r > t1) return null; if (r > t0) t0 = r; } else { if (r < t0) return null; if (r < t1) t1 = r; }
  }
  return [[a[0] + t0 * dx, a[1] + t0 * dy], [a[0] + t1 * dx, a[1] + t1 * dy]];
}

/** Prism over a counter-clockwise base polygon [[x, y], …] from height z0 to z1; pyramid to an apex. Faces outward. */
export function prismMesh(base, z0, z1) {
  const n = base.length, V = [...base.map(([x, y]) => [x, y, z0]), ...base.map(([x, y]) => [x, y, z1])];
  const F = [base.map((_, i) => n - 1 - i), base.map((_, i) => n + i)];
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; F.push([i, j, n + j, n + i]); }
  return { V, F };
}
export function pyramidMesh(base, z0, apex) {
  const n = base.length, V = [...base.map(([x, y]) => [x, y, z0]), apex];
  const F = [base.map((_, i) => n - 1 - i)];
  for (let i = 0; i < n; i++) F.push([i, (i + 1) % n, n]);
  return { V, F };
}
