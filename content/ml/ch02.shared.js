// Understanding Machine Learning — Chapter 2: helpers for the papaya square.
//
// The domain is the unit square (colour × softness). The distribution D is a product of truncated normals on [0,1]
// (a centre and a spread; a spread of 1.2 or more is exactly uniform), so the mass of every axis-aligned rectangle is
// exact; masses of other shapes come from a 40 × 40 grid. Labels are 1 ("tasty") inside the target shape.
import { Phi, clamp } from './ch01.shared.js';
export * from './ch01.shared.js';

export const GN = 40;
const gauss = (z) => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);

/** Product distribution on [0,1]²: truncated normal(mx, s) × truncated normal(my, s); s ≥ 1.2 means uniform. */
export function makeDens(mx, my, s) {
  const U = s >= 1.2, Z = (m) => Phi((1 - m) / s) - Phi((0 - m) / s), zx = U ? 1 : Z(mx), zy = U ? 1 : Z(my);
  const c1 = (x, m, z) => (U ? clamp(x, 0, 1) : (Phi((clamp(x, 0, 1) - m) / s) - Phi(-m / s)) / z);
  const d = {
    mx, my, s, U, key: [mx.toFixed(3), my.toFixed(3), s.toFixed(3)].join(','),
    cx: (x) => c1(x, mx, zx), cy: (y) => c1(y, my, zy),
    pdf: (x, y) => (U ? 1 : (gauss((x - mx) / s) / s / zx) * (gauss((y - my) / s) / s / zy)),
  };
  const TQ = 512, qt = (c) => { const T = new Float64Array(TQ + 1); for (let i = 0; i <= TQ; i++) { const u = i / TQ; let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (c(mid) < u) lo = mid; else hi = mid; } T[i] = (lo + hi) / 2; } return T; };
  const qx = U ? null : qt(d.cx), qy = U ? null : qt(d.cy);
  const look = (T, u) => { const f = u * TQ, i = Math.min(TQ - 1, Math.floor(f)); return T[i] + (T[i + 1] - T[i]) * (f - i); };
  /** Point with uniform seeds (u, w) pushed through the inverse CDFs: stable when the density moves. */
  d.fromU = (u, w) => (U ? [u, w] : [look(qx, u), look(qy, w)]);
  d.draw = (r) => d.fromU(r(), r());
  d.mass = (x0, x1, y0, y1) => Math.max(0, d.cx(x1) - d.cx(x0)) * Math.max(0, d.cy(y1) - d.cy(y0));
  const wx = new Float64Array(GN), wy = new Float64Array(GN);
  for (let i = 0; i < GN; i++) { wx[i] = d.cx((i + 1) / GN) - d.cx(i / GN); wy[i] = d.cy((i + 1) / GN) - d.cy(i / GN); }
  d.wx = wx; d.wy = wy;
  return d;
}

// ---------------------------------------------------------------- shapes
export const RECT = (x0, y0, x1, y1) => ({ t: 'rect', x0: Math.min(x0, x1), y0: Math.min(y0, y1), x1: Math.max(x0, x1), y1: Math.max(y0, y1) });
export const DISC = (cx, cy, r) => ({ t: 'disc', cx, cy, r });
export const NONE = { t: 'none' };
/** Named targets used by several items. */
export function target(kind, rect) {
  if (kind === 'rect') return rect || RECT(0.2, 0.3, 0.8, 0.75);
  if (kind === 'disc') return DISC(0.5, 0.5, 0.33);
  if (kind === 'L') return { t: 'L', a: RECT(0.15, 0.15, 0.85, 0.42), b: RECT(0.15, 0.15, 0.42, 0.85) };
  return NONE;
}
export function inShape(h, x, y) {
  switch (h.t) {
    case 'rect': return x >= h.x0 && x <= h.x1 && y >= h.y0 && y <= h.y1;
    case 'disc': return (x - h.cx) ** 2 + (y - h.cy) ** 2 <= (h.r2 ?? h.r * h.r);
    case 'L': return inShape(h.a, x, y) || inShape(h.b, x, y);
    default: return false; // 'none' and 'finite' (a finite set has no area)
  }
}
/** Mass of the shape under d (exact for rectangles, grid otherwise). */
export function shapeMass(h, d) {
  if (h.t === 'rect') return d.mass(h.x0, h.x1, h.y0, h.y1);
  if (h.t === 'none' || h.t === 'finite') return 0;
  let s = 0; for (let i = 0; i < GN; i++) for (let j = 0; j < GN; j++) if (inShape(h, (i + 0.5) / GN, (j + 0.5) / GN)) s += d.wx[i] * d.wy[j];
  return s;
}
/** D-mass of the symmetric difference of two shapes (the true error of h against labelling by t). */
export function disagree(h, t, d) {
  if (h.t === 'finite') return shapeMass(t, d);
  if (h.t === 'rect' && t.t === 'rect') {
    const ix = d.mass(Math.max(h.x0, t.x0), Math.min(h.x1, t.x1), Math.max(h.y0, t.y0), Math.min(h.y1, t.y1));
    return Math.max(0, shapeMass(h, d) + shapeMass(t, d) - 2 * ix);
  }
  let s = 0;
  for (let i = 0; i < GN; i++) { const x = (i + 0.5) / GN; for (let j = 0; j < GN; j++) { const y = (j + 0.5) / GN; if (inShape(h, x, y) !== inShape(t, x, y)) s += d.wx[i] * d.wy[j]; } }
  return s;
}
/** Draw m labelled points: arrays X, Y, L (1 = tasty); each label flipped with probability noise. */
export function drawSample(d, r, m, t, noise = 0) {
  const X = new Float64Array(m), Y = new Float64Array(m), L = new Uint8Array(m);
  for (let i = 0; i < m; i++) { const p = d.draw(r); X[i] = p[0]; Y[i] = p[1]; let l = inShape(t, p[0], p[1]) ? 1 : 0; if (noise && r() < noise) l ^= 1; L[i] = l; }
  return { X, Y, L, m };
}
/** Number of training mistakes of shape h on the sample (a finite set memorizes: no mistakes). */
export function trainErr(h, S, upto = S.m) {
  if (h.t === 'finite') return 0;
  let e = 0; for (let i = 0; i < upto; i++) if ((inShape(h, S.X[i], S.Y[i]) ? 1 : 0) !== S.L[i]) e++;
  return e;
}

// ---------------------------------------------------------------- ERM for the three classes
/** Tightest rectangle around the positives (exact ERM in the realizable case). */
export function tightBox(S, upto = S.m) {
  let x0 = 2, y0 = 2, x1 = -1, y1 = -1, any = false;
  for (let i = 0; i < upto; i++) if (S.L[i]) { any = true; if (S.X[i] < x0) x0 = S.X[i]; if (S.X[i] > x1) x1 = S.X[i]; if (S.Y[i] < y0) y0 = S.Y[i]; if (S.Y[i] > y1) y1 = S.Y[i]; }
  return any ? RECT(x0, y0, x1, y1) : NONE;
}
/** Exact ERM over axis-aligned rectangles by maximum-weight subarrays (O(m³)); returns the rectangle with fewest mistakes. */
export function ermRect(S) {
  const { X, Y, L, m } = S; if (!m) return NONE;
  const ord = Array.from({ length: m }, (_, i) => i).sort((a, b) => Y[a] - Y[b]);
  const xs = Array.from(new Set(Array.from(X))).sort((a, b) => a - b);
  let best = 0, R = NONE;
  for (let a = 0; a < xs.length; a++) for (let b = a; b < xs.length; b++) {
    let run = 0, startY = 0;
    // A horizontal boundary cannot separate points with exactly the same y.
    for (let k = 0; k < m;) {
      const y = Y[ord[k]]; let weight = 0;
      while (k < m && Y[ord[k]] === y) { const i = ord[k++]; if (X[i] >= xs[a] && X[i] <= xs[b]) weight += L[i] ? 1 : -1; }
      if (run <= 0) { run = weight; startY = y; } else run += weight;
      if (run > best) { best = run; R = RECT(xs[a], startY, xs[b], y); }
    }
  }
  return R;
}
/** Best rectangle for the grid-weighted problem (target t, distribution d): returns the rectangle and its true error. */
export function bestRectGrid(t, d) {
  const lab = (i, j) => (inShape(t, (i + 0.5) / GN, (j + 0.5) / GN) ? 1 : -1);
  let tot = 0; for (let i = 0; i < GN; i++) for (let j = 0; j < GN; j++) if (lab(i, j) > 0) tot += d.wx[i] * d.wy[j];
  let best = 0, R = NONE;
  for (let a = 0; a < GN; a++) for (let b = a; b < GN; b++) {
    let run = 0, start = 0;
    for (let j = 0; j < GN; j++) {
      let w = 0; for (let i = a; i <= b; i++) w += lab(i, j) * d.wx[i] * d.wy[j];
      if (run <= 0) { run = w; start = j; } else run += w;
      if (run > best) { best = run; R = RECT(a / GN, start / GN, (b + 1) / GN, (j + 1) / GN); }
    }
  }
  return { h: R, err: tot - best };
}
/** ERM over discs: centres on a 17 × 17 grid, radius chosen by a prefix scan of the sorted distances. */
export function ermDisc(S) {
  const { X, Y, L, m } = S; if (!m) return NONE;
  let best = 0, R = NONE; const idx = new Array(m), dd = new Float64Array(m);
  for (let a = 0; a <= 16; a++) for (let b = 0; b <= 16; b++) {
    const cx = a / 16, cy = b / 16;
    for (let i = 0; i < m; i++) { dd[i] = (X[i] - cx)**2+(Y[i]-cy)**2; idx[i] = i; }
    idx.sort((p, q) => dd[p] - dd[q]);
    let g = 0;
    for (let k = 0; k < m;) {
      const radius = dd[idx[k]];
      // An inclusive disc contains an entire distance level, including ties.
      while (k < m && dd[idx[k]] === radius) { g += L[idx[k]] ? 1 : -1; k++; }
      if (g > best) { best = g; R = {...DISC(cx, cy, Math.sqrt(radius)),r2:radius}; }
    }
  }
  return R;
}
/** The memorizing predictor: "tasty" exactly on the remembered positives. */
export const memorizer = (S) => ({ t: 'finite', pts: Array.from({ length: S.m }, (_, i) => (S.L[i] ? [S.X[i], S.Y[i]] : null)).filter(Boolean) });
export const ERM = { rect: ermRect, disc: ermDisc, finite: memorizer };

// ---------------------------------------------------------------- drawing
/** Draw a shape on a stage: style = {color, fill, fillAlpha, width, dash}. */
export function drawShape(s, h, o = {}) {
  const st = { color: o.color || 'ink', width: o.width ?? 2.2, dash: o.dash, fill: o.fill, fillAlpha: o.fillAlpha ?? 0.12 };
  if (h.t === 'rect') s.rect(h.x0, h.y0, h.x1, h.y1, st);
  else if (h.t === 'disc') s.circle(h.cx, h.cy, h.r, st);
  else if (h.t === 'L') {
    const a = h.a, b = h.b;
    s.poly([[a.x0, a.y0], [a.x1, a.y0], [a.x1, a.y1], [b.x1, a.y1], [b.x1, b.y1], [b.x0, b.y1]], st);
  } else if (h.t === 'finite') for (const p of h.pts) s.circle(p[0], p[1], 0.012, { color: o.color || 'ink', width: 2, fill: o.color || 'ink', fillAlpha: 0.9 });
}
/** The sample as dots (tasty green, not tasty pink); mistakes of h (if given) get a ring. */
export function drawSample2(s, S, h, upto = S.m, r = 4.2) {
  const pos = [], neg = [], bad = [];
  for (let i = 0; i < upto; i++) { (S.L[i] ? pos : neg).push([S.X[i], S.Y[i]]); if (h && h.t !== 'finite' && (inShape(h, S.X[i], S.Y[i]) ? 1 : 0) !== S.L[i]) bad.push([S.X[i], S.Y[i]]); }
  for (const p of bad) s.circle(p[0], p[1], 0.017, { color: 'red', width: 2.2, fill: false });
  s.dots(neg, { r, color: 'pink', alpha: 0.95 }); s.dots(pos, { r, color: 'green', alpha: 0.95 });
}
/** A density-and-disagreement raster for the papaya square: orange tint where mass is, red where h and t disagree. */
export function paintSquare(v, s, d, h, t, key, res = 4) {
  const tint = v.rgb('orange'), red = v.rgb('red'), p0 = d.pdf(d.mx, d.my);
  s.raster((x, y) => {
    const q = d.U ? 0.35 : 0.1 + 0.9 * d.pdf(x, y) / p0, dis = h && t && inShape(h, x, y) !== inShape(t, x, y);
    if (dis) return [red[0], red[1], red[2], 0.18 + 0.32 * q];
    return d.U ? null : [tint[0], tint[1], tint[2], 0.04 + 0.2 * q];
  }, { res, key });
}
/** Standard square stage. */
export function square(v, o = {}) {
  return v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: 'box', gutter: true, height: 380, xlabel: 'colour', ylabel: 'softness', xticks: [0, 1], yticks: [0, 1], ...o });
}
/** Nicely formatted probability. */
export const pr = (x, d = 3) => x.toFixed(d);
