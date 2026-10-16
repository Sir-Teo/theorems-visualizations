// Visual Art & Color — Chapter 2 (anamorphosis, optical devices, painters' practice): helpers shared by ch02.js and ch02-b.js.
//
// World axes follow chapter 1: x to the right, y forward (away from the viewer), z up.
export { camera, seg3, boxMesh, drawFigure, clipSeg2, meet } from './ch01.shared.js';

export const rad = (d) => (d * Math.PI) / 180;
export const deg = (r) => (r * 180) / Math.PI;

/** Bessel J1 (power series for small x, Hankel asymptotics beyond 9; accurate to about 1e-6). */
export function J1(x) {
  const ax = Math.abs(x);
  let r;
  if (ax < 9) {
    const t = ax / 2; let term = t, s = 0;
    for (let k = 0; k < 40; k++) { s += term; term *= -(t * t) / ((k + 1) * (k + 2)); }
    r = s;
  } else {
    const mu = 4;
    const P = 1 - ((mu - 1) * (mu - 9)) / (2 * (8 * ax) ** 2);
    const Q = (mu - 1) / (8 * ax) - ((mu - 1) * (mu - 9) * (mu - 25)) / (6 * (8 * ax) ** 3);
    const chi = ax - (3 * Math.PI) / 4;
    r = Math.sqrt(2 / (Math.PI * ax)) * (P * Math.cos(chi) - Q * Math.sin(chi));
  }
  return x < 0 ? -r : r;
}
/** Airy intensity profile 4·(J1(x)/x)^2, equal to 1 at x = 0. */
export const airy = (x) => (Math.abs(x) < 1e-6 ? 1 : (2 * J1(x) / x) ** 2);

/** Resample a polyline so that no segment is longer than `step` (so a nonlinear map bends it properly). */
export function densify(pts, step = 0.05) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    out.push(pts[i]);
    if (i + 1 < pts.length) {
      const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
      for (let k = 1; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
    }
  }
  return out;
}

const ellipse = (cx, cy, rx, ry, n = 48, a0 = 0, a1 = 2 * Math.PI) =>
  Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });

/** A schematic skull as shapes in a unit box, x in [-1, 1], y in [-1.3, 1.2]: [{pts, close, fill}]. */
export function skull() {
  const S = [];
  S.push({ pts: ellipse(0, 0.32, 0.8, 0.86), close: true });
  S.push({ pts: [[-0.56, -0.18], [-0.5, -0.62], [-0.3, -0.86], [0.3, -0.86], [0.5, -0.62], [0.56, -0.18]], close: false });
  S.push({ pts: [[-0.4, -0.9], [-0.36, -1.24], [0.36, -1.24], [0.4, -0.9]], close: false });
  for (let k = -3; k <= 3; k++) S.push({ pts: [[k * 0.1, -0.86], [k * 0.1, -1.08]], close: false });
  S.push({ pts: [[-0.4, -1.08], [0.4, -1.08]], close: false });
  S.push({ pts: ellipse(-0.31, 0.2, 0.2, 0.24), close: true, fill: true });
  S.push({ pts: ellipse(0.31, 0.2, 0.2, 0.24), close: true, fill: true });
  S.push({ pts: [[0, -0.08], [-0.11, -0.4], [0.11, -0.4]], close: true, fill: true });
  S.push({ pts: [[-0.06, 0.95], [-0.2, 0.55]], close: false });
  S.push({ pts: [[0.56, 0.62], [0.5, 0.02]], close: false });
  S.push({ pts: [[-0.56, 0.62], [-0.5, 0.02]], close: false });
  return S;
}

/** A face (outline, eyes, smile) in the box [-1, 1]^2, as shapes {pts, close, fill}. */
export function face() {
  return [
    { pts: ellipse(0, 0, 0.95, 1.0, 64), close: true },
    { pts: ellipse(-0.34, 0.3, 0.1, 0.14, 20), close: true, fill: true },
    { pts: ellipse(0.34, 0.3, 0.1, 0.14, 20), close: true, fill: true },
    { pts: [[0, 0.22], [-0.08, -0.12], [0.08, -0.12]], close: false },
    { pts: ellipse(0, -0.12, 0.55, 0.52, 32, Math.PI * 1.15, Math.PI * 1.85), close: false },
  ];
}
/** A square grid with a few marks in [-1, 1]^2. */
export function gridShapes(n = 8) {
  const S = [];
  for (let k = 0; k <= n; k++) {
    const t = -1 + (2 * k) / n;
    S.push({ pts: [[t, -1], [t, 1]], close: false, alpha: k % 2 ? 0.45 : 1 });
    S.push({ pts: [[-1, t], [1, t]], close: false, alpha: k % 2 ? 0.45 : 1 });
  }
  S.push({ pts: ellipse(0, 0, 0.5, 0.5, 40), close: true });
  return S;
}

/** Lute: lists of 3D polylines in the lute's own frame (t across, s along the neck, w towards the viewer). */
export function luteCurves() {
  const W = (s) => Math.max(0.085, 0.4 * Math.sqrt(Math.max(0, Math.sin(Math.PI * Math.pow(s, 0.78)))));
  const C = [];
  for (let k = -6; k <= 6; k += 2) {
    const a = (k / 6) * (Math.PI / 2);
    const line = [];
    for (let i = 0; i <= 28; i++) { const s = i / 28; line.push([W(s) * Math.sin(a), s, 0.5 * W(s) * Math.cos(a)]); }
    C.push(line);
  }
  // rim of the soundboard and a few cross sections of the belly
  for (const s of [0.15, 0.3, 0.45, 0.6, 0.75, 0.9]) {
    const line = [];
    for (let i = 0; i <= 16; i++) { const a = -Math.PI / 2 + (Math.PI * i) / 16; line.push([W(s) * Math.sin(a), s, 0.5 * W(s) * Math.cos(a)]); }
    C.push(line);
  }
  // rose and bridge on the soundboard
  const rose = []; for (let i = 0; i <= 24; i++) { const a = (2 * Math.PI * i) / 24; rose.push([0.12 * Math.cos(a), 0.5 + 0.12 * Math.sin(a), 0]); }
  C.push(rose, [[-0.14, 0.17, 0], [0.14, 0.17, 0]]);
  // neck, strings, pegbox
  C.push([[-0.07, 1.0, 0], [-0.07, 1.6, 0]], [[0.07, 1.0, 0], [0.07, 1.6, 0]]);
  for (const t of [-0.04, 0, 0.04]) C.push([[t * 0.8, 0.2, 0.05], [t * 0.8, 1.6, 0.05]]);
  C.push([[-0.09, 1.6, 0], [-0.09, 1.78, -0.16], [-0.09, 1.9, -0.2], [0.09, 1.9, -0.2], [0.09, 1.78, -0.16], [0.09, 1.6, 0]]);
  C.push([[-0.09, 1.78, -0.16], [0.09, 1.78, -0.16]]);
  return C;
}

/** Place local points: rotate by pitch (about the t axis) and yaw (about vertical), scale, and move to centre c. */
export function placeLocal(P, c, { yaw = 0, pitch = 0, scale = 1, belly = -1 } = {}) {
  const cp = Math.cos(pitch), sp = Math.sin(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw);
  // local (t, s, w): s is along the neck (starts pointing along +z up), w is the bulge towards the viewer (-y)
  const [t, s, w] = P;
  const x0 = t, y0 = belly * w, z0 = s; // untilted: neck up, belly toward -y
  // tilt about the t axis by `pitch`: neck leans away from the viewer
  const y1 = y0 * cp + z0 * sp, z1 = -y0 * sp + z0 * cp;
  return [c[0] + scale * (x0 * cy + y1 * sy), c[1] + scale * (-x0 * sy + y1 * cy), c[2] + scale * z1];
}

/** A vase as 3D polylines: meridians and parallels of a surface of revolution about the vertical axis through c. */
export function vaseCurves(c, scale = 1) {
  const prof = (h) => 0.28 + 0.2 * Math.sin(Math.PI * Math.min(1, h * 1.25)) ** 1.3 - 0.12 * Math.max(0, h - 0.7) * 3 + 0.1 * Math.max(0, h - 0.92) * 8; // radius at height h in [0,1]
  const C = [], nm = 12, H = 1.5;
  for (let m = 0; m < nm; m++) {
    const a = (2 * Math.PI * m) / nm, line = [];
    for (let i = 0; i <= 18; i++) { const h = i / 18, r = prof(h) * scale; line.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), c[2] + h * H * scale]); }
    C.push(line);
  }
  for (const h of [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1]) {
    const line = [], r = prof(h) * scale;
    for (let i = 0; i <= 36; i++) { const a = (2 * Math.PI * i) / 36; line.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), c[2] + h * H * scale]); }
    C.push(line);
  }
  return C;
}

/** Central projection of a 3D point P from the eye E onto the vertical plane y = 0 (E has y < 0): [x, z] or null. */
export function projectToFrame(E, P) {
  const dy = P[1] - E[1];
  if (dy <= 1e-9) return null;
  const s = -E[1] / dy;
  return [E[0] + s * (P[0] - E[0]), E[2] + s * (P[2] - E[2])];
}
