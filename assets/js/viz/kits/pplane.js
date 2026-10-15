// Phase-plane kit — planar ODEs x' = f(x, y, t, p): direction field or streamlines, nullclines, fixed points found by
// Newton and classified by the Jacobian, click-launched trajectories (forward and backward, RK4 or RK45, stopping at the
// edge, at a fixed point or on a closed orbit / limit cycle), saddle separatrices and energy contours. Reference: docs/kits-science.md.
//
//   const pp = v.phasePlane(stage, { f: (x, y, t, p) => [p.a * x - x * y, x * y - y], params: { a: slider },
//                                    field: 'arrows', nullclines: true, fixedPoints: true, seeds: [[2, 1]] });
//   v.render(() => pp.draw());
//   v.readout(() => pp.describe());
//
// Params may be numbers, controls ({value}) or functions; their current values form the cache key, so the expensive layers
// are recomputed only when a parameter, the view or the trajectory list changes (pass `key: () => …` if f reads other state).
// DOM-free helpers (fixedPoints, classify, orbit, eig2x2, jacobian) are exported for tests and other kits.
import { gridOf, isolines, niceLevels, streamlines, arrowField, arrowHead } from './fields.js';

const TAU = 2 * Math.PI;
const val = (x) => (x && typeof x === 'object' && 'value' in x ? x.value : typeof x === 'function' ? x() : x);
const fx = (x, d = 2) => { const s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace(/\.?0+$/, ''); return s === '-0' ? '0' : s.replace('-', '−'); };

// ------------------------------------------------------------------ linear algebra on 2×2 Jacobians
/** Eigenvalues (and real eigenvectors when they exist) of [[a,b],[c,d]]: {l: [{re,im},{re,im}], vecs, tr, det, disc}. */
export function eig2x2([[a, b], [c, d]]) {
  const tr = a + d, det = a * d - b * c, disc = tr * tr - 4 * det;
  if (disc >= 0) {
    const s = Math.sqrt(disc), l1 = (tr + s) / 2, l2 = (tr - s) / 2;
    const vec = (l) => { let v = Math.abs(b) > 1e-14 * (Math.abs(a) + Math.abs(d) + 1) ? [b, l - a] : Math.abs(c) > 1e-14 * (Math.abs(a) + Math.abs(d) + 1) ? [l - d, c] : (Math.abs(a - l) < Math.abs(d - l) ? [1, 0] : [0, 1]); const n = Math.hypot(...v) || 1; return [v[0] / n, v[1] / n]; };
    return { l: [{ re: l1, im: 0 }, { re: l2, im: 0 }], vecs: [vec(l1), vec(l2)], tr, det, disc };
  }
  const s = Math.sqrt(-disc) / 2; return { l: [{ re: tr / 2, im: s }, { re: tr / 2, im: -s }], vecs: null, tr, det, disc };
}
/** Central-difference Jacobian of g(x, y) → [u, v] at (x, y) with step h. */
export function jacobian(g, x, y, h = 1e-6) {
  const a = g(x + h, y), b = g(x - h, y), c = g(x, y + h), d = g(x, y - h);
  return [[(a[0] - b[0]) / (2 * h), (c[0] - d[0]) / (2 * h)], [(a[1] - b[1]) / (2 * h), (c[1] - d[1]) / (2 * h)]];
}
/**
 * Classify an equilibrium from its Jacobian: {type, stable, kind, label, l, vecs, tr, det}.
 * kind ∈ saddle | node | spiral | center | star | degenerate; type adds stability, e.g. 'stable spiral', 'saddle', 'center'.
 */
export function classify(J, tol = 1e-7) {
  const e = eig2x2(J), { tr, det, disc } = e, sc = Math.abs(J[0][0]) + Math.abs(J[0][1]) + Math.abs(J[1][0]) + Math.abs(J[1][1]) + 1e-300;
  let kind;
  if (Math.abs(det) <= tol * sc * sc) kind = 'degenerate';
  else if (det < 0) kind = 'saddle';
  else if (Math.abs(tr) <= tol * sc) kind = 'center';
  else if (Math.abs(disc) <= tol * sc * sc) kind = 'star';
  else kind = disc < 0 ? 'spiral' : 'node';
  const stable = kind === 'saddle' || kind === 'center' || kind === 'degenerate' ? null : tr < 0;
  const type = stable == null ? kind : `${stable ? 'stable' : 'unstable'} ${kind === 'star' ? 'degenerate node' : kind}`;
  // rotation sense of a spiral / center (sign of the angular velocity of the linearisation): +1 counter-clockwise
  const rot = kind === 'spiral' || kind === 'center' ? Math.sign(J[1][0] - J[0][1]) || 1 : 0;
  return { ...e, kind, stable, type, rot };
}

// ------------------------------------------------------------------ fixed points (Newton from a grid of seeds)
/**
 * Equilibria of g(x, y) → [u, v] inside bounds {x:[a,b], y:[c,d]}.
 * opts: {nx, ny (seed grid, 11×9), J(x,y) analytic Jacobian, tol, margin}. → [{x, y, J, ...classify(J)}]
 */
export function fixedPoints(g, bounds, opts = {}) {
  const [x0, x1] = bounds.x, [y0, y1] = bounds.y, W = x1 - x0, H = y1 - y0, diag = Math.hypot(W, H), m = opts.margin ?? 0.08;
  const nx = opts.nx ?? 11, ny = opts.ny ?? 9, h = opts.h ?? 1e-6 * diag, Jf = opts.J || ((x, y) => jacobian(g, x, y, h));
  const found = [];
  const norm = (p) => { const r = g(p[0], p[1]); return Math.hypot(r[0], r[1]); };
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    let p = [x0 - m * W + (1 + 2 * m) * W * (i + 0.5) / nx, y0 - m * H + (1 + 2 * m) * H * (j + 0.5) / ny], r = norm(p), ok = false;
    for (let it = 0; it < 60; it++) {
      if (!isFinite(r)) break;
      const F = g(p[0], p[1]), J = Jf(p[0], p[1]), det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
      if (!isFinite(det) || Math.abs(det) < 1e-300) break;
      const dx = (J[1][1] * F[0] - J[0][1] * F[1]) / det, dy = (-J[1][0] * F[0] + J[0][0] * F[1]) / det;
      let lam = 1, q, rq;
      do { q = [p[0] - lam * dx, p[1] - lam * dy]; rq = norm(q); lam /= 2; } while (!(rq < r) && lam > 1e-4);
      const step = Math.hypot(p[0] - q[0], p[1] - q[1]); p = q; r = rq;
      if (step < 1e-13 * diag || r < 1e-14) { ok = true; break; }
      if (Math.abs(p[0] - (x0 + x1) / 2) > 3 * W || Math.abs(p[1] - (y0 + y1) / 2) > 3 * H) break;
    }
    if (!ok && !(r < 1e-9)) continue;
    if (p[0] < x0 - 1e-9 * W || p[0] > x1 + 1e-9 * W || p[1] < y0 - 1e-9 * H || p[1] > y1 + 1e-9 * H) continue;
    if (found.some((f) => Math.hypot(f.x - p[0], f.y - p[1]) < 1e-5 * diag)) continue;
    found.push({ x: p[0], y: p[1] });
    if (found.length > (opts.max ?? 40)) break;
  }
  return found.map((f) => { const J = Jf(f.x, f.y); return { ...f, J, ...classify(J) }; }).sort((a, b) => a.x - b.x || a.y - b.y);
}

// ------------------------------------------------------------------ trajectories
// Dormand–Prince 5(4) coefficients
const DP = { c: [0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1, 1], a: [[], [1 / 5], [3 / 40, 9 / 40], [44 / 45, -56 / 15, 32 / 9], [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729], [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656], [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84]],
  b: [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84, 0], e: [71 / 57600, 0, -71 / 16695, 71 / 1920, -17253 / 339200, 22 / 525, -1 / 40] };
/**
 * Integrate a trajectory of g(x, y, t) → [u, v] from (x, y) at time t0, in direction dir (+1 forward, −1 backward).
 * opts: {bounds, sx, sy (px per unit; steps are limited to `px` pixels so curves are smooth), method 'rk4'|'rk45', dt (max step),
 *        tMax, maxSteps, rtol, atol, sinks: [[x,y]] (stop within 1.5 px), cycles (true: detect closed orbits / limit cycles)}.
 * → {pts, ts, stop: 'edge'|'fixed point'|'closed orbit'|'limit cycle'|'time'|'steps'|'blow-up', period}
 */
export function orbit(g, x, y, opts = {}) {
  const dir = opts.dir ?? 1, B = opts.bounds, sx = opts.sx ?? 100, sy = opts.sy ?? sx, maxPx = opts.px ?? 1.6, dtMax = opts.dt ?? 0.02;
  const tMax = opts.tMax ?? 200, maxSteps = opts.maxSteps ?? 40000, rk45 = opts.method === 'rk45', rtol = opts.rtol ?? 1e-7, atol = opts.atol ?? 1e-10;
  const t0 = opts.t0 ?? 0, F = (px, py, t) => { const r = g(px, py, t); return [dir * r[0], dir * r[1]]; };
  const mx = B ? (B.x[1] - B.x[0]) * 0.03 : 0, my = B ? (B.y[1] - B.y[0]) * 0.03 : 0;
  const pts = [[x, y]], ts = [t0]; let t = 0, stop = 'time', h = dtMax, period = null;
  // Poincaré section through the start, normal to the flow there; crossings in the flow direction are compared
  const f0 = F(x, y, t0), n0 = Math.hypot(f0[0] * sx, f0[1] * sy), useCyc = opts.cycles !== false && n0 > 1e-9;
  const nx = useCyc ? f0[0] * sx / n0 : 0, ny = useCyc ? f0[1] * sy / n0 : 0; let prevS = 0, crossings = 0, left = false, lastT = 0;
  const qs = [0], tol = opts.cycleTol ?? 0.6;
  const sinks = opts.sinks || [];
  for (let k = 0; k < maxSteps; k++) {
    const k1 = F(x, y, t0 + dir * t), sp = Math.hypot(k1[0] * sx, k1[1] * sy);
    if (!isFinite(sp)) { stop = 'blow-up'; break; }
    let hh = Math.min(dtMax, sp > 0 ? maxPx / sp : dtMax), nxp, nyp;
    if (!rk45) {
      const k2 = F(x + hh / 2 * k1[0], y + hh / 2 * k1[1], t0 + dir * (t + hh / 2)), k3 = F(x + hh / 2 * k2[0], y + hh / 2 * k2[1], t0 + dir * (t + hh / 2)), k4 = F(x + hh * k3[0], y + hh * k3[1], t0 + dir * (t + hh));
      nxp = x + hh / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); nyp = y + hh / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    } else {
      hh = Math.min(hh, h);
      for (let tries = 0; tries < 30; tries++) {
        const K = [k1];
        for (let s = 1; s < 7; s++) { let ax = x, ay = y; for (let j = 0; j < s; j++) { ax += hh * DP.a[s][j] * K[j][0]; ay += hh * DP.a[s][j] * K[j][1]; } K.push(F(ax, ay, t0 + dir * (t + DP.c[s] * hh))); }
        let ex = 0, ey = 0; nxp = x; nyp = y;
        for (let s = 0; s < 7; s++) { nxp += hh * DP.b[s] * K[s][0]; nyp += hh * DP.b[s] * K[s][1]; ex += hh * DP.e[s] * K[s][0]; ey += hh * DP.e[s] * K[s][1]; }
        const err = Math.max(Math.abs(ex) / (atol + rtol * Math.max(Math.abs(x), Math.abs(nxp))), Math.abs(ey) / (atol + rtol * Math.max(Math.abs(y), Math.abs(nyp))));
        if (err <= 1 || hh < 1e-9) { h = Math.min(dtMax, hh * Math.min(5, 0.9 * Math.pow(Math.max(err, 1e-10), -0.2))); break; }
        hh *= Math.max(0.2, 0.9 * Math.pow(err, -0.25));
      }
    }
    if (!isFinite(nxp) || !isFinite(nyp)) { stop = 'blow-up'; break; }
    // section crossing test (in px coordinates relative to the start)
    if (useCyc) {
      const qx = (nxp - pts[0][0]) * sx, qy = (nyp - pts[0][1]) * sy, s = qx * nx + qy * ny;
      if (!left && Math.hypot(qx, qy) > 4) left = true;
      if (left && prevS < 0 && s >= 0) {
        const px0 = (x - pts[0][0]) * sx, py0 = (y - pts[0][1]) * sy, u = prevS / (prevS - s);
        const cx = px0 + u * (qx - px0), cy = py0 + u * (qy - py0), q = -cx * ny + cy * nx; // position along the section
        if (Math.abs(q) < 0.5 * Math.hypot(B ? (B.x[1] - B.x[0]) * sx : 1e4, B ? (B.y[1] - B.y[0]) * sy : 1e4)) {
          crossings++; const tc = t + u * hh; qs.push(q);
          // closed: the first return lands on the start; limit cycle: successive returns converge and the remaining
          // distance to the limit (geometric extrapolation) is below tolerance — a slowly decaying spiral does not qualify
          const n = qs.length, d1 = qs[n - 1] - qs[n - 2], d0 = n > 2 ? qs[n - 2] - qs[n - 3] : NaN, r = Math.abs(d1 / d0);
          const closed = crossings === 1 ? Math.abs(d1) < tol : Math.abs(d1) < 0.05 || (Math.abs(d1) < tol && r < 1 && Math.abs(d1) * r / (1 - r) < 2 * tol);
          if (closed) { x = pts[0][0] + cx / sx; y = pts[0][1] + cy / sy; pts.push([x, y]); ts.push(t0 + dir * tc); period = tc - lastT; stop = crossings === 1 ? 'closed orbit' : 'limit cycle'; break; }
          lastT = tc;
        }
      }
      prevS = s;
    }
    x = nxp; y = nyp; t += hh; pts.push([x, y]); ts.push(t0 + dir * t);
    if (B && (x < B.x[0] - mx || x > B.x[1] + mx || y < B.y[0] - my || y > B.y[1] + my)) { stop = 'edge'; break; }
    if (sinks.some(([a, b]) => Math.hypot((x - a) * sx, (y - b) * sy) < 1.5)) { stop = 'fixed point'; break; }
    if (sp * dtMax < 1e-4 && k > 50) { stop = 'fixed point'; break; }
    if (t >= tMax) { stop = 'time'; break; }
    if (k === maxSteps - 1) stop = 'steps';
  }
  return { pts, ts, stop, period };
}

// ================================================================== the kit
const GLYPH = { stable: 'green', unstable: 'red', saddle: 'ink', center: 'teal', degenerate: 'muted' };
const CYCLE = ['accent', 'pink', 'teal', 'gold', 'purple', 'orange', 'green'];

class PhasePlane {
  constructor(api, rt, stage, spec = {}) {
    if (!stage || typeof stage.X !== 'function') throw new Error('v.phasePlane(stage, spec): the first argument must be a 2D stage');
    if (typeof spec.f !== 'function') throw new Error('v.phasePlane: spec.f(x, y, t, p) → [dx, dy] is required');
    this.api = api; this.rt = rt; this.s = stage;
    this.o = { field: 'arrows', nullclines: true, fixedPoints: true, separatrices: false, click: true, both: true, method: 'rk4', dt: 0.02, tMax: 200,
      maxTraj: 12, trajColor: 'accent', fieldColor: 'muted', spacing: 30, labels: false, particles: false, t: 0, ...spec };
    this.trajectories = []; this._key = null; this._fp = []; this._layers = null;
    for (const p of spec.seeds || []) this.add(p[0], p[1], { silent: true, color: p[2] });
    if (this.o.click) stage.onClick((x, y) => { this.add(x, y); this.o.onLaunch?.(this.trajectories[this.trajectories.length - 1]); });
  }
  /** Current parameter values (controls and functions resolved). */
  params() { const P = val(this.o.params); if (!P || typeof P !== 'object') return P ?? {}; const out = {}; for (const k in P) out[k] = val(P[k]); return out; }
  /** g(x, y, t) with the current params bound. */
  g() { const p = this.params(), f = this.o.f; return (x, y, t = this.o.t) => f(x, y, t, p); }
  /** Launch a trajectory from (x, y) (forward and, if spec.both, backward). Returns it. */
  add(x, y, o = {}) {
    const i = this._n = (this._n ?? -1) + 1;
    const color = o.color || (this.o.trajColor === 'cycle' ? CYCLE[this.trajectories.length % CYCLE.length] : typeof this.o.trajColor === 'function' ? this.o.trajColor(i) : this.o.trajColor);
    const tr = { x0: x, y0: y, color, fwd: null, bwd: null };
    this.trajectories.push(tr);
    while (this.trajectories.length > this.o.maxTraj) this.trajectories.shift();
    this._key = null; if (!o.silent) this.rt.invalidate(); return tr;
  }
  /** Remove all click-launched trajectories. */
  clear() { this.trajectories.length = 0; this._key = null; this.rt.invalidate(); return this; }
  _space() { const s = this.s; return { bounds: s.bounds, sx: s.sx, sy: s.sy }; }
  _keyNow() { const b = this.s.bounds; return JSON.stringify([this.params(), b, this.s.sx, this.s.sy, this.o.t, val(this.o.key) ?? null, this.trajectories.map((t) => [t.x0, t.y0])]); }
  /** Recompute fixed points, trajectories and contour layers if the parameters, view or seeds changed. */
  update(force = false) {
    const key = this._keyNow(); if (!force && key === this._key) return this; this._key = key;
    const g = this.g(), sp = this._space(), o = this.o, B = sp.bounds;
    this._fp = o.fixedPoints === false && !o.separatrices ? [] : fixedPoints((x, y) => g(x, y), B, { J: o.J ? (x, y) => o.J(x, y, o.t, this.params()) : null });
    const run = (x, y, dir) => orbit(g, x, y, { dir, bounds: B, sx: sp.sx, sy: sp.sy, method: o.method, dt: o.dt, tMax: o.tMax, t0: o.t,
      sinks: this._fp.filter((f) => (dir > 0 ? f.stable === true : f.stable === false)).map((f) => [f.x, f.y]), cycles: o.cycles !== false });
    for (const tr of this.trajectories) { tr.fwd = run(tr.x0, tr.y0, 1); tr.bwd = o.both ? run(tr.x0, tr.y0, -1) : null; }
    // separatrices: from each saddle along its eigenvectors (unstable → forward, stable → backward)
    this._sep = [];
    if (o.separatrices) for (const f of this._fp) if (f.kind === 'saddle' && f.vecs) {
      const eps = 1.5 / Math.max(sp.sx, sp.sy);
      f.l.forEach((l, k) => { const v = f.vecs[k], dir = l.re > 0 ? 1 : -1; for (const sg of [1, -1]) this._sep.push({ unstable: dir > 0, ...run(f.x + sg * eps * v[0], f.y + sg * eps * v[1], dir) }); });
    }
    // nullclines and energy contours
    const s = this.s, nx = Math.max(40, Math.round(s.W / 4)), ny = Math.max(30, Math.round(s.H / 4));
    this._layers = {};
    if (o.nullclines) {
      const G1 = gridOf((x, y) => g(x, y)[0], B, nx, ny), G2 = gridOf((x, y) => g(x, y)[1], B, nx, ny);
      this._layers.nx = isolines(G1, 0, { fn: (x, y) => g(x, y)[0] }); this._layers.ny = isolines(G2, 0, { fn: (x, y) => g(x, y)[1] });
    }
    if (o.H) {
      const p = this.params(), Hf = (x, y) => o.H(x, y, p), G = gridOf(Hf, B, nx, ny), opt = typeof o.contours === 'object' && !Array.isArray(o.contours) ? o.contours : {};
      const levels = typeof o.contours === 'function' ? o.contours(p, Hf) : Array.isArray(o.contours) ? o.contours : Array.isArray(opt.levels) ? opt.levels : niceLevels(G, typeof o.contours === 'number' ? o.contours : opt.n ?? 12, 0.02);
      this._layers.H = levels.map((lv) => isolines(G, lv, { fn: Hf }));
      this._layers.Hsaddle = this._fp.filter((f) => f.kind === 'saddle').map((f) => isolines(G, Hf(f.x, f.y), { fn: Hf }));
    }
    return this;
  }
  /** Equilibria in view: [{x, y, type, kind, stable, l (eigenvalues), vecs, J}]. */
  fixedPoints() { this.update(); return this._fp; }
  /** Position at time t along trajectory k (forward branch; wraps at its end). */
  at(k, t) {
    this.update(); const tr = this.trajectories[k]; if (!tr || !tr.fwd) return null; const { pts, ts } = tr.fwd, T = ts[ts.length - 1] - ts[0];
    if (!(T > 0)) return pts[0]; let tt = ts[0] + (((t % T) + T) % T), lo = 0, hi = ts.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ts[m] <= tt) lo = m; else hi = m; }
    const u = (tt - ts[lo]) / (ts[hi] - ts[lo] || 1); return [pts[lo][0] + u * (pts[hi][0] - pts[lo][0]), pts[lo][1] + u * (pts[hi][1] - pts[lo][1])];
  }
  // ---------------------------------------------------------------- drawing
  /** Draw all layers. Overrides per call: draw({field: 'stream', particles: true, t}). */
  draw(over = {}) {
    const o = { ...this.o, ...over }, s = this.s, api = this.api; this.update();
    const g = this.g(), L = this._layers;
    if (o.field === 'arrows') arrowField(s, api, (x, y) => g(x, y), { spacing: o.spacing, color: o.fieldColor, alpha: 0.55 });
    else if (o.field === 'stream') {
      const sp = { x: s.bounds.x, y: s.bounds.y, sx: s.sx, sy: s.sy }, avoid = this._fp.map((f) => [f.x, f.y, 7]);
      const key = this._key; if (this._streamKey !== key) { this._streamKey = key; this._stream = streamlines((x, y) => g(x, y), sp, { sep: o.streamSep ?? 26, avoid }); }
      for (const l of this._stream) { s.path(l.pts, { color: o.fieldColor, width: 1, alpha: 0.5 }); this._heads(l.pts, o.fieldColor, 0.6, 'mid', 6); }
    }
    if (L.H) {
      const cc = (typeof o.contours === 'object' && o.contours?.color) || 'faint';
      for (const lines of L.H) for (const l of lines) s.path(l, { color: cc, width: 1, alpha: 0.9 });
      for (const lines of L.Hsaddle) for (const l of lines) s.path(l, { color: 'muted', width: 1.2, dash: [5, 4], alpha: 0.9 });
    }
    if (L.nx) { for (const l of L.nx) s.path(l, { color: o.nullColorX || 'orange', width: 2, alpha: 0.85 }); for (const l of L.ny) s.path(l, { color: o.nullColorY || 'purple', width: 2, alpha: 0.85 }); }
    for (const sp of this._sep || []) { s.path(sp.pts, { color: sp.unstable ? 'red' : 'green', width: 1.6, alpha: 0.75 }); this._heads(sp.pts, sp.unstable ? 'red' : 'green', 0.8, 150, 7, !sp.unstable); }
    for (const tr of this.trajectories) {
      if (tr.bwd) { s.path(tr.bwd.pts, { color: tr.color, width: 2, alpha: 0.55 }); this._heads(tr.bwd.pts, tr.color, 0.6, 140, 8, true); }
      s.path(tr.fwd.pts, { color: tr.color, width: 2.2 }); this._heads(tr.fwd.pts, tr.color, 1, 140, 8.5);
      s.dot(tr.x0, tr.y0, { color: tr.color, r: 3.5 });
    }
    if (o.particles) this.trajectories.forEach((tr, k) => { const p = this.at(k, o.t ?? 0); if (p) s.dot(p[0], p[1], { color: 'gold', r: 5 }); });
    if (o.fixedPoints !== false) for (const f of this._fp) this._glyph(f, o.labels);
    if (this._legendExtra) { const items = this.legendItems(this._legendExtra), sig = JSON.stringify(items); if (sig !== this._legendSig) { this._legendSig = sig; this.api.legend(items); } }
    return this;
  }
  _heads(pts, color, alpha, every, size, reverse) {
    const s = this.s, c = s.ctx; if (pts.length < 3) return;
    const P = pts.map((p) => [s.X(p[0]), s.Y(p[1])]); let total = 0; for (let i = 1; i < P.length; i++) total += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    if (total < 24) return;
    const nm = Math.max(1, Math.min(this.o.maxHeads ?? 6, Math.floor(total / every))), marks = every === 'mid' ? [total / 2] : Array.from({ length: nm }, (_, k) => (k + 0.5) * total / nm);
    c.save(); c.fillStyle = this.api.color(color, alpha); let acc = 0, mi = 0;
    for (let i = 1; i < P.length && mi < marks.length; i++) {
      const Ls = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
      while (mi < marks.length && acc + Ls >= marks[mi]) { const u = Ls ? (marks[mi] - acc) / Ls : 0, d = reverse ? -1 : 1; arrowHead(c, P[i - 1][0] + u * (P[i][0] - P[i - 1][0]), P[i - 1][1] + u * (P[i][1] - P[i - 1][1]), d * (P[i][0] - P[i - 1][0]), d * (P[i][1] - P[i - 1][1]), size); mi++; }
      acc += Ls;
    }
    c.restore();
  }
  _glyph(f, labels) {
    const s = this.s, api = this.api, c = s.ctx, X = s.X(f.x), Y = s.Y(f.y), r = 6.5;
    if (X < -10 || X > s.W + 10 || Y < -10 || Y > s.H + 10) return;
    const panel = api.color('panel'), ring = () => { c.lineWidth = 2; c.stroke(); };
    c.save();
    if (f.kind === 'saddle') {
      // eigen-directions: unstable (outward, red) and stable (inward, green) ticks, then a half-filled disc
      if (f.vecs) f.l.forEach((l, k) => {
        const v = f.vecs[k], px = v[0] * s.sx, py = -v[1] * s.sy, n = Math.hypot(px, py) || 1, ux = px / n, uy = py / n, out = l.re > 0;
        c.strokeStyle = c.fillStyle = api.color(out ? 'red' : 'green', 0.9); c.lineWidth = 1.6;
        for (const sg of [1, -1]) { c.beginPath(); c.moveTo(X + sg * ux * (r + 2), Y + sg * uy * (r + 2)); c.lineTo(X + sg * ux * (r + 13), Y + sg * uy * (r + 13)); c.stroke(); arrowHead(c, X + sg * ux * (out ? r + 15 : r + 5), Y + sg * uy * (out ? r + 15 : r + 5), (out ? sg : -sg) * ux, (out ? sg : -sg) * uy, 6); }
      });
      c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fillStyle = panel; c.fill(); c.strokeStyle = api.color('ink'); ring();
      c.beginPath(); c.arc(X, Y, r, Math.PI / 2, Math.PI * 1.5); c.closePath(); c.fillStyle = api.color('ink'); c.fill();
    } else if (f.kind === 'center') {
      const col = api.color(GLYPH.center);
      c.beginPath(); c.arc(X, Y, r + 1, 0, TAU); c.fillStyle = panel; c.fill(); c.strokeStyle = col; ring();
      c.beginPath(); c.arc(X, Y, 2.6, 0, TAU); c.fillStyle = col; c.fill();
      this._swirl(X, Y, r + 5, f.rot, col);
    } else if (f.kind === 'degenerate') {
      c.beginPath(); c.moveTo(X, Y - r); c.lineTo(X + r, Y); c.lineTo(X, Y + r); c.lineTo(X - r, Y); c.closePath(); c.fillStyle = panel; c.fill(); c.strokeStyle = api.color(GLYPH.degenerate); ring();
    } else {
      const col = api.color(f.stable ? GLYPH.stable : GLYPH.unstable);
      c.beginPath(); c.arc(X, Y, r, 0, TAU);
      if (f.stable) { c.fillStyle = col; c.fill(); c.lineWidth = 1.5; c.strokeStyle = panel; c.stroke(); } else { c.fillStyle = panel; c.fill(); c.strokeStyle = col; c.lineWidth = 2.4; c.stroke(); }
      if (f.kind === 'spiral') this._swirl(X, Y, r + 5, f.rot, col);
    }
    c.restore();
    if (labels) s.text(f.type, f.x, f.y, { dx: 12, dy: -12, size: 11.5, color: 'muted', align: 'left' });
  }
  _swirl(X, Y, R, rot, col) {
    const c = this.s.ctx, a0 = -0.4, a1 = a0 + 1.5 * Math.PI; // three-quarter arc; screen y is down so ccw (data) = negative angles on screen
    c.beginPath(); c.arc(X, Y, R, -a0, -a1, true); c.strokeStyle = col; c.lineWidth = 1.5; c.stroke();
    const end = rot >= 0 ? -a1 : -a0, tx = rot >= 0 ? Math.sin(end) : -Math.sin(end), ty = rot >= 0 ? -Math.cos(end) : Math.cos(end);
    c.fillStyle = col; arrowHead(c, X + R * Math.cos(end), Y + R * Math.sin(end), tx, ty, 6);
  }
  // ---------------------------------------------------------------- text helpers
  /** Rich-text summary of the equilibria (for v.readout). opts {digits, max, eig: true}. */
  describe(opts = {}) {
    const d = opts.digits ?? 2, fp = this.fixedPoints().slice(0, opts.max ?? 6);
    if (!fp.length) return 'No fixed points in view.';
    const lam = (f) => (f.l[0].im ? `\\lambda = ${fx(f.l[0].re, d)} \\pm ${fx(Math.abs(f.l[0].im), d)}i` : `\\lambda = ${fx(f.l[0].re, d)},\\ ${fx(f.l[1].re, d)}`);
    return fp.map((f) => `$(${fx(f.x, d)},\\,${fx(f.y, d)})$ **${f.type}**${opts.eig === false ? '' : ` ($${lam(f)}$)`}`).join(' · ');
  }
  /** Legend entries for the layers in use and the kinds of equilibria currently in view (extra items appended). */
  legendItems(extra = []) {
    const o = this.o, items = [], names = o.names || {};
    if (o.click || this.trajectories.length) items.push([this.trajectories[0]?.color || (o.trajColor === 'cycle' ? 'accent' : o.trajColor), o.click ? 'trajectories (click to add)' : 'trajectories']);
    if (o.nullclines) items.push([o.nullColorX || 'orange', names.x ? `$${names.x}' = 0$` : "$x' = 0$"], [o.nullColorY || 'purple', names.y ? `$${names.y}' = 0$` : "$y' = 0$"]);
    if (o.H && !(Array.isArray(o.contours) && !o.contours.length)) items.push(['faint', 'level sets of $H$']);
    if (o.separatrices) items.push(['green', 'stable manifold'], ['red', 'unstable manifold']);
    if (o.fixedPoints !== false) {
      const seen = new Set(); this.update();
      for (const f of this._fp) { if (seen.has(f.type)) continue; seen.add(f.type); items.push([f.kind === 'saddle' ? 'ink' : f.kind === 'center' ? GLYPH.center : f.kind === 'degenerate' ? GLYPH.degenerate : f.stable ? GLYPH.stable : GLYPH.unstable, f.type, { dot: true }]); }
    }
    return [...items, ...extra];
  }
  /** Set the legend (extra items appended) and keep it in sync with the equilibria on later draws. */
  legend(extra = []) { this._legendExtra = extra; const items = this.legendItems(extra); this._legendSig = JSON.stringify(items); this.api.legend(items); return items; }
}

export default function phasePlane(api, rt, stage, spec) { return new PhasePlane(api, rt, stage, spec); }
