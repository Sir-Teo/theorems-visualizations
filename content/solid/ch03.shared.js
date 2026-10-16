// Solid Mechanics & Structures — Chapter 3: helpers shared by ch03.js (plain named exports).
//
//   re-exports the chapter-2 helpers (oblique-cube drawer, plane-stress Q4 solver, number formatting), and adds the plane-stress
//   rotation formulas, principal values, a rotatable stress-element drawer and a Mohr's-circle drawer used by several items.
//   Sign convention (Gere & Goodno): tension positive; tau_xy positive when it points +y on the +x face; theta is the
//   counter-clockwise angle from x to x'. With tau plotted UPWARD, an element turned counter-clockwise by theta moves its
//   Mohr point CLOCKWISE by 2*theta.

export * from './ch02.shared.js';

const D2R = Math.PI / 180;
export const deg = (r) => (r * 180) / Math.PI;
export const rad = (d) => d * D2R;

/** Plane-stress components on the axes x', y' rotated by th (radians, counter-clockwise). */
export function tr2(sx, sy, t, th) {
  const c = Math.cos(2 * th), s = Math.sin(2 * th), m = (sx + sy) / 2, d = (sx - sy) / 2;
  return { sx: m + d * c + t * s, sy: m - d * c - t * s, t: -d * s + t * c };
}

/** Principal values of a plane-stress state: s1 >= s2, centre c, radius R, angle thp (rad) of the s1 axis from x, in (-pi/2, pi/2]. */
export function prin2(sx, sy, t) {
  const c = (sx + sy) / 2, d = (sx - sy) / 2, R = Math.hypot(d, t);
  let thp = 0.5 * Math.atan2(t, d); // direction where sx' is maximal
  if (thp <= -Math.PI / 2) thp += Math.PI;
  return { c, R, s1: c + R, s2: c - R, thp, ths: thp + Math.PI / 4 };
}

/** Rotate a vector. */
export const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];

/**
 * Draw a plane-stress element: a square of half-size h centred at c, turned by ang (rad), with the normal stresses sx, sy
 * and shear stress t drawn as arrows on its four faces (scale k per unit stress, in stage units).
 * opts: labels (bool, default true) writes the names given in names = [sx, sy, t] (TeX); color overrides; axes draws the x', y' axes.
 */
export function drawElem(v, s, c, h, ang, sx, sy, t, k, opts = {}) {
  const { names = [String.raw`\sigma_{x'}`, String.raw`\sigma_{y'}`, String.raw`\tau_{x'y'}`], labels = true, fill = 'accent', thresh = 0.02, axes = false, edge = 'ink', arrowW = 3 } = opts;
  const P = (x, y) => { const r = rot([x, y], ang); return [c[0] + r[0], c[1] + r[1]]; };
  s.path([P(-h, -h), P(h, -h), P(h, h), P(-h, h)], { close: true, color: edge, width: 2, fill, fillAlpha: 0.13 });
  const arr = (a, b, col, w = arrowW) => s.arrow(a[0], a[1], b[0], b[1], { color: col, width: w, head: 9 });
  const nrm = (q, face) => { // face: +1 for the +x'/+y' face, -1 for the opposite one; q the stress; axis flag handled by caller
    const L = Math.abs(q) * k; return L < thresh ? null : L;
  };
  const colN = (q) => (q >= 0 ? 'accent' : 'red');
  // normal arrows
  for (const [q, ax] of [[sx, 0], [sy, 1]]) {
    const L = nrm(q); if (L == null) continue;
    for (const sg of [1, -1]) {
      const f = ax === 0 ? [sg * h, 0] : [0, sg * h], d = ax === 0 ? [sg, 0] : [0, sg];
      const out = [f[0] + d[0] * L, f[1] + d[1] * L];
      if (q >= 0) arr(P(f[0], f[1]), P(out[0], out[1]), colN(q)); else arr(P(out[0], out[1]), P(f[0], f[1]), colN(q));
    }
    if (labels && names[ax]) { const e = ax === 0 ? [h + L + 0.3, 0] : [0, h + L + 0.3]; const pp = P(e[0], e[1]); s.tex(names[ax], pp[0], pp[1], { size: 13, color: colN(q) }); }
  }
  // shear arrows: on +x' face points +y' for t>0; +y' face points -x'; -x' face -y'; -y' face +x'
  if (Math.abs(t) * k >= thresh) {
    const L = Math.min(Math.abs(t) * k, 1.9 * h), sg = Math.sign(t), o = 0.17 * h;
    const faces = [[[h + o, 0], [0, sg]], [[0, h + o], [-sg, 0]], [[-h - o, 0], [0, -sg]], [[0, -h - o], [sg, 0]]];
    for (const [f, d] of faces) arr(P(f[0] - d[0] * L / 2, f[1] - d[1] * L / 2), P(f[0] + d[0] * L / 2, f[1] + d[1] * L / 2), 'orange');
    if (labels && names[2]) { const pp = P(h + o + 0.55, L / 2 + 0.2); s.tex(names[2], pp[0], pp[1], { size: 13, color: 'orange' }); }
  }
  if (axes) {
    const a0 = P(h * 1.0, 0), a1 = P(h * 1.0 + 0.0, 0);
    void a0; void a1;
  }
  return P;
}

/** Axes x' (red-ish accent) and y' drawn from a point as two small arrows, with labels. */
export function primeAxes(s, o, ang, len = 0.9, col = 'muted') {
  const ex = rot([len, 0], ang), ey = rot([0, len], ang);
  s.arrow(o[0], o[1], o[0] + ex[0], o[1] + ex[1], { color: col, width: 1.6, head: 7 });
  s.arrow(o[0], o[1], o[0] + ey[0], o[1] + ey[1], { color: col, width: 1.6, head: 7 });
  s.text("x′", o[0] + ex[0] * 1.2, o[1] + ex[1] * 1.2, { size: 12, color: col, math: true, align: 'center', baseline: 'middle' });
  s.text("y′", o[0] + ey[0] * 1.2, o[1] + ey[1] * 1.2, { size: 12, color: col, math: true, align: 'center', baseline: 'middle' });
}

/** Round to a nice axis half-range for a Mohr stage. */
export const niceRange = (m) => { const e = 10 ** Math.floor(Math.log10(m)), f = m / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e; };
