// Fields kit — 2D vector fields and potentials: field lines seeded by flux, equipotentials, streamlines,
// heat maps, draggable sources and a draggable closed loop with live flux / circulation. Reference: docs/kits-science.md.
//
//   const F = v.fields(stage, { sources: [{ type: 'charge', x: -1, y: 0, q: 1 }, { type: 'charge', x: 1, y: 0, q: -1 }],
//                               lines: true, equipotentials: true, heat: 'potential', loop: { type: 'circle', x: -1, y: 0, r: 0.8 } });
//   v.render(() => F.draw());
//   v.readout(() => `$\\Phi = ${v.fix(F.flux(), 3)}$, $q_{enc}/\\varepsilon_0 = ${v.fix(F.enclosed().q, 3)}$`);
//
// Physics conventions (2D, the default `law: '2d'`): a "charge" is a line charge, E = q r̂ / (2π ε0 r), so Gauss's law holds
// exactly for any closed curve in the plane: ∮ E·n ds = q_enc / ε0. `law: '3d'` gives point charges seen in a plane (1/r²).
// Every field is F = −∇φ (φ = potential), and ψ is a stream function with F = (∂ψ/∂y, −∂ψ/∂x).
// DOM-free helpers (gridOf, isolines, contours, streamlines, lineIntegrals, …) are exported for other kits and tests.

const TAU = 2 * Math.PI;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const val = (x) => (x && typeof x === 'object' && 'value' in x ? x.value : typeof x === 'function' ? x() : x);

// ------------------------------------------------------------------ grids and isolines (marching squares)
/** Sample fn(x, y) on an nx × ny lattice covering bounds {x:[a,b], y:[c,d]}. → {nx, ny, x0, y0, dx, dy, z} */
export function gridOf(fn, bounds, nx = 120, ny = 90) {
  const [x0, x1] = bounds.x, [y0, y1] = bounds.y, dx = (x1 - x0) / (nx - 1), dy = (y1 - y0) / (ny - 1);
  const z = new Float64Array(nx * ny);
  for (let j = 0; j < ny; j++) { const y = y0 + j * dy; for (let i = 0; i < nx; i++) { let v; try { v = fn(x0 + i * dx, y); } catch { v = NaN; } z[j * nx + i] = v; } }
  return { nx, ny, x0, y0, dx, dy, z };
}
/**
 * Level set {z = level} of a sampled grid as linked polylines [[x,y],…]. Saddle cells are resolved by the cell mean.
 * opts.guard (default true) skips cells where the sign change is a pole (centre value much larger than the corners).
 */
export function isolines(G, level = 0, opts = {}) {
  const { nx, ny, x0, y0, dx, dy, z } = G, guard = opts.guard !== false, fn = opts.fn;
  const P = new Map(); const segs = [];
  const key = (i, j, v) => 2 * (j * nx + i) + v; // edge (i,j)→(i+1,j) is v=0, (i,j)→(i,j+1) is v=1
  const pt = (k) => {
    if (P.has(k)) return P.get(k);
    const e = k >> 1, v = k & 1, i = e % nx, j = (e - i) / nx;
    const a = z[j * nx + i] - level, b = (v ? z[(j + 1) * nx + i] : z[j * nx + i + 1]) - level, t = a / (a - b);
    const p = v ? [x0 + i * dx, y0 + (j + t) * dy] : [x0 + (i + t) * dx, y0 + j * dy]; P.set(k, p); return p;
  };
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = z[j * nx + i] - level, b = z[j * nx + i + 1] - level, c = z[(j + 1) * nx + i + 1] - level, d = z[(j + 1) * nx + i] - level;
    if (!(isFinite(a) && isFinite(b) && isFinite(c) && isFinite(d))) continue;
    const idx = (a > 0) | ((b > 0) << 1) | ((c > 0) << 2) | ((d > 0) << 3);
    if (idx === 0 || idx === 15) continue;
    if (guard) {
      const m = Math.max(Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d));
      const ctr = fn ? fn(x0 + (i + 0.5) * dx, y0 + (j + 0.5) * dy) - level : (a + b + c + d) / 4;
      if (fn && !(Math.abs(ctr) <= 3 * m)) continue;
      if (!fn) { const mn = Math.min(Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d)); if (mn > 0 && m / mn > 1e6 && m > 1e8) continue; }
    }
    const B = key(i, j, 0), R = key(i + 1, j, 1), T = key(i, j + 1, 0), L = key(i, j, 1);
    const s = (p, q) => segs.push([p, q]);
    switch (idx) {
      case 1: case 14: s(L, B); break; case 2: case 13: s(B, R); break; case 3: case 12: s(L, R); break;
      case 4: case 11: s(R, T); break; case 6: case 9: s(B, T); break; case 7: case 8: s(L, T); break;
      case 5: case 10: { const m = (a + b + c + d) / 4; if ((m > 0) === (idx === 5)) { s(L, T); s(B, R); } else { s(L, B); s(R, T); } break; }
    }
  }
  // link segments sharing an edge point into polylines
  const adj = new Map(); segs.forEach(([p, q], k) => { for (const e of [p, q]) { const l = adj.get(e); if (l) l.push(k); else adj.set(e, [k]); } });
  const used = new Uint8Array(segs.length), lines = [];
  const walk = (start, k0) => { const out = [start]; let cur = start, k = k0; while (k != null && !used[k]) { used[k] = 1; const [p, q] = segs[k]; const nxt = p === cur ? q : p; out.push(nxt); cur = nxt; k = (adj.get(cur) || []).find((m) => !used[m]); } return out; };
  for (let k = 0; k < segs.length; k++) {
    if (used[k]) continue;
    let [p] = segs[k]; // walk back to a free end first so open lines come out in one piece
    let cur = p, prev = k, guardN = segs.length;
    while (guardN-- > 0) { const nk = (adj.get(cur) || []).find((m) => m !== prev && !used[m]); if (nk == null) break; const [a, b] = segs[nk]; cur = a === cur ? b : a; prev = nk; if (cur === p) break; }
    const startSeg = (adj.get(cur) || []).find((m) => !used[m]);
    if (startSeg == null) continue;
    lines.push(walk(cur, startSeg).map(pt));
  }
  return lines;
}
/** Contours of fn at the given levels: [{level, lines}]. opts {nx, ny, guard}. */
export function contours(fn, bounds, levels, opts = {}) {
  const G = gridOf(fn, bounds, opts.nx || 120, opts.ny || 90);
  return levels.map((level) => ({ level, lines: isolines(G, level, { ...opts, fn: opts.guard === false ? null : fn }) }));
}
/** n "nice" levels spanning the robust range (q, 1−q quantiles) of a sampled grid. */
export function niceLevels(G, n = 12, q = 0.04, symmetric = false) {
  const vals = Array.from(G.z).filter(isFinite).sort((a, b) => a - b); if (!vals.length) return [];
  let lo = vals[Math.floor(q * (vals.length - 1))], hi = vals[Math.ceil((1 - q) * (vals.length - 1))];
  if (symmetric) { const m = Math.max(Math.abs(lo), Math.abs(hi)); lo = -m; hi = m; }
  if (!(hi > lo)) return [lo];
  const raw = (hi - lo) / n, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p, step = (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  const out = []; for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9 * step; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return out;
}

// ------------------------------------------------------------------ line integrals
/** Integrate g(s) → [a, b] over [s0, s1] with adaptive Simpson (vector-valued, 2 components). */
export function integrate2(g, s0, s1, tol = 1e-10, depth = 22) {
  const G = (s) => { const r = g(s); return [isFinite(r[0]) ? r[0] : 0, isFinite(r[1]) ? r[1] : 0]; };
  const rec = (a, b, fa, fm, fb, whole, t, dp) => {
    const m = (a + b) / 2, lm = (a + m) / 2, rm = (m + b) / 2, flm = G(lm), frm = G(rm), h = (b - a) / 12;
    const left = [h * (fa[0] + 4 * flm[0] + fm[0]), h * (fa[1] + 4 * flm[1] + fm[1])], right = [h * (fm[0] + 4 * frm[0] + fb[0]), h * (fm[1] + 4 * frm[1] + fb[1])];
    const d0 = left[0] + right[0] - whole[0], d1 = left[1] + right[1] - whole[1];
    if (dp <= 0 || (Math.abs(d0) <= 15 * t && Math.abs(d1) <= 15 * t)) return [left[0] + right[0] + d0 / 15, left[1] + right[1] + d1 / 15];
    const L = rec(a, m, fa, flm, fm, left, t / 2, dp - 1), R = rec(m, b, fm, frm, fb, right, t / 2, dp - 1);
    return [L[0] + R[0], L[1] + R[1]];
  };
  // start from 16 panels so narrow features are not missed
  const n = 16, out = [0, 0];
  for (let k = 0; k < n; k++) {
    const a = s0 + (s1 - s0) * k / n, b = s0 + (s1 - s0) * (k + 1) / n, fa = G(a), fb = G(b), fm = G((a + b) / 2);
    const whole = [(b - a) / 6 * (fa[0] + 4 * fm[0] + fb[0]), (b - a) / 6 * (fa[1] + 4 * fm[1] + fb[1])];
    const r = rec(a, b, fa, fm, fb, whole, tol / n, depth); out[0] += r[0]; out[1] += r[1];
  }
  return out;
}
/**
 * Flux ∮F·n ds (outward normal) and circulation ∮F·t ds (counter-clockwise) of F around a closed curve.
 * curve: {type:'circle', x, y, r} or a closed polygon [[x,y],…] (either orientation). → {flux, circulation, length}
 */
export function lineIntegrals(F, curve, tol = 1e-9) {
  if (!Array.isArray(curve) && curve.type === 'circle') {
    const { x, y, r } = curve;
    const [flux, circ] = integrate2((th) => { const c = Math.cos(th), s = Math.sin(th), [u, w] = F(x + r * c, y + r * s); return [(u * c + w * s) * r, (-u * s + w * c) * r]; }, 0, TAU, tol);
    return { flux, circulation: circ, length: TAU * Math.abs(r) };
  }
  const pts = Array.isArray(curve) ? curve : curve.pts; const n = pts.length; let A = 0;
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; A += p[0] * q[1] - q[0] * p[1]; }
  const sg = A >= 0 ? 1 : -1; let flux = 0, circ = 0, len = 0;
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n], ex = q[0] - p[0], ey = q[1] - p[1]; len += Math.hypot(ex, ey);
    const [a, b] = integrate2((s) => { const [u, w] = F(p[0] + s * ex, p[1] + s * ey); return [sg * (u * ey - w * ex), sg * (u * ex + w * ey)]; }, 0, 1, tol);
    flux += a; circ += b;
  }
  return { flux, circulation: circ, length: len };
}
export const circlePts = (x, y, r, n = 128) => Array.from({ length: n }, (_, k) => [x + r * Math.cos(TAU * k / n), y + r * Math.sin(TAU * k / n)]);
export function pointInPoly([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; }
  return inside;
}

// ------------------------------------------------------------------ sources
/** Field of point sources (+ optional uniform background). law '2d' (line charges, 1/r) or '3d' (1/r²). */
export function sourceField(sources, o = {}) {
  const law3 = o.law === '3d', eps0 = o.eps0 ?? 1, G = o.G ?? 1, U = o.uniform || [0, 0], extra = o.extra;
  return (x, y) => {
    let u = U[0], w = U[1];
    for (const s of sources) {
      const dx = x - s.x, dy = y - s.y, r2 = dx * dx + dy * dy; if (r2 === 0) return [NaN, NaN];
      const t = s.type || 'charge';
      if (t === 'vortex') { const k = (s.gamma ?? s.q ?? 1) / (TAU * r2); u -= k * dy; w += k * dx; continue; }
      const q = t === 'mass' ? -G * (s.m ?? s.q ?? 1) : t === 'source' ? (s.m ?? s.q ?? 1) : (s.q ?? 1) / eps0;
      const k = law3 ? q / (2 * TAU * r2 * Math.sqrt(r2)) : q / (TAU * r2); u += k * dx; w += k * dy;
    }
    if (extra) { const e = extra(x, y); u += e[0]; w += e[1]; }
    return [u, w];
  };
}
/** Potential φ with F = −∇φ for charges, sources, masses and the uniform part (vortices have no single-valued φ). */
export function sourcePotential(sources, o = {}) {
  const law3 = o.law === '3d', eps0 = o.eps0 ?? 1, G = o.G ?? 1, U = o.uniform || [0, 0], extra = o.phi;
  return (x, y) => {
    let p = -(U[0] * x + U[1] * y);
    for (const s of sources) {
      const t = s.type || 'charge'; if (t === 'vortex') continue;
      const q = t === 'mass' ? -G * (s.m ?? s.q ?? 1) : t === 'source' ? (s.m ?? s.q ?? 1) : (s.q ?? 1) / eps0;
      const r = Math.hypot(x - s.x, y - s.y); p += law3 ? q / (2 * TAU * r) : -q * Math.log(r) / TAU;
    }
    return extra ? p + extra(x, y) : p;
  };
}
/** Stream function ψ (F = (∂ψ/∂y, −∂ψ/∂x)) for vortices and the uniform part. */
export function sourceStream(sources, o = {}) {
  const U = o.uniform || [0, 0], extra = o.psi;
  return (x, y) => {
    let p = U[0] * y - U[1] * x;
    for (const s of sources) if (s.type === 'vortex') p -= (s.gamma ?? s.q ?? 1) * Math.log(Math.hypot(x - s.x, y - s.y)) / TAU;
    return extra ? p + extra(x, y) : p;
  };
}
/** Signed strength of a source as it enters Gauss's law (flux it emits) and Stokes (circulation). */
export function strengthOf(s, o = {}) {
  const t = s.type || 'charge';
  if (t === 'vortex') return { q: 0, gamma: s.gamma ?? s.q ?? 1 };
  return { q: t === 'mass' ? -(o.G ?? 1) * (s.m ?? s.q ?? 1) : t === 'source' ? (s.m ?? s.q ?? 1) : (s.q ?? 1), gamma: 0 };
}

// ------------------------------------------------------------------ field lines and streamlines (pixel-metric RK4)
/**
 * Trace one line of F from (x, y) in arc-length steps of `step` px (direction ±1). sp = {x:[a,b], y:[c,d], sx, sy} (px per unit).
 * opts: {dir, step, maxLen (px), stop(x,y,lenPx) → reason|null}. → {pts, reason, len}
 */
export function traceLine(F, x, y, sp, opts = {}) {
  const dir = opts.dir ?? 1, h = opts.step ?? 2, maxLen = opts.maxLen ?? 4000, stop = opts.stop, sx = sp.sx, sy = sp.sy ?? sp.sx;
  const mx = (sp.x[1] - sp.x[0]) * 0.02, my = (sp.y[1] - sp.y[0]) * 0.02;
  const D = (px, py) => { const [u, w] = F(px, py), U = u * sx, W = w * sy, L = Math.hypot(U, W); return L > 0 && isFinite(L) ? [dir * U / L / sx, dir * W / L / sy, L] : null; };
  const pts = [[x, y]]; let len = 0, reason = 'length';
  while (len < maxLen) {
    const k1 = D(x, y); if (!k1) { reason = 'stagnation'; break; }
    const k2 = D(x + h / 2 * k1[0], y + h / 2 * k1[1]); if (!k2) { reason = 'stagnation'; break; }
    const k3 = D(x + h / 2 * k2[0], y + h / 2 * k2[1]); if (!k3) { reason = 'stagnation'; break; }
    const k4 = D(x + h * k3[0], y + h * k3[1]); if (!k4) { reason = 'stagnation'; break; }
    const nx = x + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), ny = y + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    // a sharp turn means we stepped over a singularity or a stagnation point
    if (k1[0] * k4[0] * sx * sx + k1[1] * k4[1] * sy * sy < -0.2) { reason = 'singular'; break; }
    x = nx; y = ny; len += h; pts.push([x, y]);
    if (x < sp.x[0] - mx || x > sp.x[1] + mx || y < sp.y[0] - my || y > sp.y[1] + my) { reason = 'edge'; break; }
    const r = stop && stop(x, y, len, pts); if (r) { reason = r; break; }
  }
  return { pts, reason, len };
}
/**
 * Evenly spaced streamlines (after Jobard & Lefer): lines of F at separation ≈ sep px.
 * sp = {x, y, sx, sy}; opts {sep (px, 24), test (fraction of sep where lines stop, .5), step (px, 2), seeds: [[x,y]], avoid: [[x,y,rPx]]}.
 * → [{pts, mid}] where mid = index of the middle point (for an arrowhead).
 */
export function streamlines(F, sp, opts = {}) {
  const sep = opts.sep ?? 24, dtest = sep * (opts.test ?? 0.5), h = opts.step ?? 2, sx = sp.sx, sy = sp.sy ?? sp.sx;
  const W = (sp.x[1] - sp.x[0]) * sx, H = (sp.y[1] - sp.y[0]) * sy, cs = sep, gw = Math.ceil(W / cs) + 1, gh = Math.ceil(H / cs) + 1;
  const cells = new Map(); const PX = (x) => (x - sp.x[0]) * sx, PY = (y) => (y - sp.y[0]) * sy;
  const near = (px, py, d, line, idx) => {
    const ci = Math.floor(px / cs), cj = Math.floor(py / cs);
    for (let a = ci - 1; a <= ci + 1; a++) for (let b = cj - 1; b <= cj + 1; b++) {
      const l = cells.get(b * gw + a); if (!l) continue;
      for (const q of l) { if (q[2] === line && Math.abs(q[3] - idx) < 3 * sep / h) continue; if ((q[0] - px) ** 2 + (q[1] - py) ** 2 < d * d) return true; }
    }
    return false;
  };
  const add = (px, py, line, idx) => { const k = Math.floor(py / cs) * gw + Math.floor(px / cs); const l = cells.get(k); if (l) l.push([px, py, line, idx]); else cells.set(k, [[px, py, line, idx]]); };
  const avoid = opts.avoid || [];
  const blocked = (x, y) => avoid.some(([ax, ay, r]) => Math.hypot((x - ax) * sx, (y - ay) * sy) < r);
  const lines = []; const queue = [];
  const tryLine = (x, y) => {
    if (x < sp.x[0] || x > sp.x[1] || y < sp.y[0] || y > sp.y[1] || blocked(x, y) || near(PX(x), PY(y), sep * 0.98, -1, 0)) return false;
    const id = lines.length; let count = 0;
    const stop = (px, py) => (blocked(px, py) ? 'source' : near(PX(px), PY(py), dtest, id, count++) ? 'near' : null);
    count = 0; const f = traceLine(F, x, y, sp, { dir: 1, step: h, stop, maxLen: opts.maxLen ?? 3000 });
    count = 0; const b = traceLine(F, x, y, sp, { dir: -1, step: h, stop, maxLen: opts.maxLen ?? 3000 });
    const pts = b.pts.slice(1).reverse().concat(f.pts);
    if (pts.length * h < (opts.minLen ?? sep * 0.8)) return false;
    pts.forEach((p, i) => add(PX(p[0]), PY(p[1]), id, i));
    lines.push({ pts, mid: Math.floor(pts.length / 2) }); queue.push(id); return true;
  };
  for (const s of opts.seeds || []) tryLine(s[0], s[1]);
  const grid = []; for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) grid.push([sp.x[0] + (i + 0.5) * cs / sx, sp.y[0] + (j + 0.5) * cs / sy]);
  let gi = 0;
  while (true) {
    while (queue.length) {
      const L = lines[queue.shift()].pts;
      for (let i = 0; i < L.length; i += 3) {
        const p = L[i], q = L[Math.min(L.length - 1, i + 1)], r = L[Math.max(0, i - 1)];
        const tx = (q[0] - r[0]) * sx, ty = (q[1] - r[1]) * sy, tl = Math.hypot(tx, ty); if (!tl) continue;
        for (const sgn of [1, -1]) tryLine(p[0] - sgn * ty / tl * sep / sx, p[1] + sgn * tx / tl * sep / sy);
      }
    }
    while (gi < grid.length && !tryLine(grid[gi][0], grid[gi][1])) gi++;
    if (gi >= grid.length) break;
  }
  return lines;
}

// ------------------------------------------------------------------ drawing helpers (pixel space, shared with other kits)
/** Arrowhead at pixel (X, Y) pointing along (dx, dy). */
export function arrowHead(c, X, Y, dx, dy, size = 7) {
  const L = Math.hypot(dx, dy); if (!L) return; const ux = dx / L, uy = dy / L;
  c.beginPath(); c.moveTo(X + ux * size * 0.55, Y + uy * size * 0.55); c.lineTo(X - ux * size * 0.45 - uy * size * 0.42, Y - uy * size * 0.45 + ux * size * 0.42);
  c.lineTo(X - ux * size * 0.45 + uy * size * 0.42, Y - uy * size * 0.45 - ux * size * 0.42); c.closePath(); c.fill();
}
/** Stroke a data-space polyline and put arrowheads every `every` px of arc length (or one at the middle if every = 'mid'). */
export function arrowPath(s, api, pts, st = {}) {
  if (!pts || pts.length < 2) return;
  s.path(pts, st);
  const every = st.every ?? 'mid', c = s.ctx, col = api.color(st.color || 'ink', st.alpha); c.save(); c.fillStyle = col;
  const P = pts.map((p) => [s.X(p[0]), s.Y(p[1])]); let acc = 0, total = 0;
  for (let i = 1; i < P.length; i++) total += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
  if (total < (st.minLen ?? 30)) { c.restore(); return; }
  const marks = every === 'mid' ? [total / 2] : (() => { const m = []; const n = Math.max(1, Math.floor(total / every)); for (let k = 0; k < n; k++) m.push((k + 0.5) * total / n); return m; })();
  let mi = 0;
  for (let i = 1; i < P.length && mi < marks.length; i++) {
    const L = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    while (mi < marks.length && acc + L >= marks[mi]) {
      const t = L ? (marks[mi] - acc) / L : 0, X = P[i - 1][0] + t * (P[i][0] - P[i - 1][0]), Y = P[i - 1][1] + t * (P[i][1] - P[i - 1][1]);
      const j = Math.min(P.length - 1, i + 1), k = Math.max(0, i - 2);
      arrowHead(c, X, Y, (st.reverse ? -1 : 1) * (P[j][0] - P[k][0]), (st.reverse ? -1 : 1) * (P[j][1] - P[k][1]), st.head ?? 7.5); mi++;
    }
    acc += L;
  }
  c.restore();
}
/** Direction-field arrows of F (uniform length, opacity by log-magnitude) every `spacing` px. */
export function arrowField(s, api, F, st = {}) {
  const sp = st.spacing ?? 30, c = s.ctx, pts = []; let lo = Infinity, hi = -Infinity;
  for (let px = sp / 2; px < s.W; px += sp) for (let py = sp / 2; py < s.H; py += sp) {
    const [x, y] = s.inv(px, py); let u, w; try { [u, w] = F(x, y); } catch { continue; }
    const U = u * s.sx, Wv = -w * s.sy, L = Math.hypot(U, Wv); if (!(L > 0) || !isFinite(L)) continue;
    const g = Math.log(L); lo = Math.min(lo, g); hi = Math.max(hi, g); pts.push([px, py, U / L, Wv / L, g]);
  }
  c.save(); c.lineWidth = st.width ?? 1.2; c.lineCap = 'round';
  const len = st.length ?? sp * 0.5, base = st.color || 'muted';
  for (const [px, py, ux, uy, g] of pts) {
    const a = (st.alpha ?? 0.7) * (hi > lo ? 0.35 + 0.65 * (g - lo) / (hi - lo) : 1);
    c.strokeStyle = c.fillStyle = api.color(base, a);
    const x0 = px - ux * len / 2, y0 = py - uy * len / 2, x1 = px + ux * len / 2, y1 = py + uy * len / 2;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ux * 3, y1 - uy * 3); c.stroke(); arrowHead(c, x1, y1, ux, uy, 6);
  }
  c.restore();
}
/** Theme-safe signed colour ramp: t in [−1, 1] → rgb array, through the panel colour at 0. */
export function signedRamp(api, pos = 'red', neg = 'blue', strength = 0.8) {
  const P = api.rgb('panel'), A = api.rgb(pos), B = api.rgb(neg);
  return (t) => { const C = t >= 0 ? A : B, k = strength * Math.min(1, Math.abs(t)); return [P[0] + (C[0] - P[0]) * k, P[1] + (C[1] - P[1]) * k, P[2] + (C[2] - P[2]) * k]; };
}
const spaceOf = (s) => ({ x: s.bounds.x, y: s.bounds.y, sx: s.sx, sy: s.sy });

// ================================================================== the kit
const TYPE_COL = { charge: (q) => (q >= 0 ? 'red' : 'blue'), source: (q) => (q >= 0 ? 'teal' : 'orange'), vortex: () => 'purple', mass: () => 'gold' };
/** Charge label: '+1', '−2', '+0.5', '0'. */
export const fmtQ = (q) => (q > 0 ? '+' : q < 0 ? '−' : '') + String(+Math.abs(q).toFixed(2));
const SYM = { charge: 'q', source: 'm', vortex: 'Γ', mass: 'M' };

class Fields {
  constructor(api, rt, stage, spec = {}) {
    if (!stage || typeof stage.X !== 'function') throw new Error('v.fields(stage, spec): the first argument must be a 2D stage');
    this.api = api; this.rt = rt; this.s = stage;
    this.o = { law: '2d', eps0: 1, G: 1, lines: true, lineDensity: 8, equipotentials: false, streamFunction: false, streamlines: false, arrows: false, heat: false, loopArrows: 'normal', ...spec };
    this.sources = (spec.sources || []).map((s) => ({ type: 'charge', draggable: true, ...s }));
    this.handles = this.sources.map((src) => {
      if (src.draggable === false) return null;
      const t = src.type, q = t === 'vortex' ? src.gamma ?? src.q ?? 1 : t === 'mass' ? src.m ?? src.q ?? 1 : t === 'source' ? src.m ?? src.q ?? 1 : src.q ?? 1;
      const label = src.label ?? (t === 'charge' ? fmtQ(q) : t === 'vortex' ? (q < 0 ? '−Γ' : 'Γ') : t === 'source' ? (q < 0 ? 'sink' : 'source') : 'M');
      const hd = stage.handle(src.x, src.y, { color: src.color || (TYPE_COL[t] || TYPE_COL.charge)(q), r: src.r ?? 8, label, labelPos: src.labelPos || 'ne' });
      return hd;
    });
    this._loopInit(spec.loop);
  }
  _loopInit(L) {
    this.loop = null; if (!L) return;
    const s = this.s, col = L.color || 'green';
    if (L.type === 'circle' || L.r != null) {
      const a = L.handleAngle ?? Math.PI / 4;
      const c = s.handle(L.x, L.y, { color: col, r: 6 }), rim = s.handle(L.x + L.r * Math.cos(a), L.y + L.r * Math.sin(a), { color: col, r: 5 });
      let last = [c.x, c.y]; c.onDrag = () => { rim.x += c.x - last[0]; rim.y += c.y - last[1]; last = [c.x, c.y]; };
      this.loop = { type: 'circle', c, rim, color: col, get x() { return c.x; }, get y() { return c.y; }, get r() { return Math.hypot(rim.x - c.x, rim.y - c.y); }, sync() { last = [c.x, c.y]; } };
    } else {
      const pts = L.pts || [[L.x0, L.y0], [L.x1, L.y0], [L.x1, L.y1], [L.x0, L.y1]];
      const hs = pts.map((p) => s.handle(p[0], p[1], { color: col, r: 5 }));
      this.loop = { type: 'poly', hs, color: col, get pts() { return hs.map((h) => [h.x, h.y]); } };
    }
  }
  /** Change a source's strength (q, m or gamma) and keep its handle's colour and label in sync. */
  setStrength(i, q) {
    const src = this.sources[i], hd = this.handles[i], t = src.type; if (t === 'vortex') src.gamma = q; else if (t === 'mass' || t === 'source') src.m = q; else src.q = q;
    if (hd) { hd.color = src.color || (TYPE_COL[t] || TYPE_COL.charge)(q); if (src.label == null) hd.label = t === 'charge' ? fmtQ(q) : t === 'vortex' ? (q < 0 ? '−Γ' : 'Γ') : t === 'source' ? (q < 0 ? 'sink' : 'source') : 'M'; }
    return this;
  }
  /** Current sources with live (dragged) positions. */
  live() { return this.sources.map((s, i) => (this.handles[i] ? { ...s, x: this.handles[i].x, y: this.handles[i].y } : s)); }
  _opts() { const o = this.o; return { law: o.law, eps0: o.eps0, G: o.G, uniform: val(o.uniform), extra: o.extra, phi: o.phi, psi: o.psi }; }
  /** Field vector at (x, y). */
  field(x, y) { return (this.o.F || sourceField(this.live(), this._opts()))(x, y); }
  /** Field function (x, y) → [u, v] for the current source positions. */
  F() { return this.o.F || sourceField(this.live(), this._opts()); }
  potential(x, y) { return (this.o.F && this.o.phi ? this.o.phi : sourcePotential(this.live(), this._opts()))(x, y); }
  stream(x, y) { return (this.o.F && this.o.psi ? this.o.psi : sourceStream(this.live(), this._opts()))(x, y); }
  /** The loop as a curve for lineIntegrals: {type:'circle',x,y,r} or polygon points. */
  curve() { const L = this.loop; if (!L) return null; return L.type === 'circle' ? { type: 'circle', x: L.x, y: L.y, r: L.r } : L.pts; }
  /** Flux of F out of the loop (numerical line integral). */
  flux() { const c = this.curve(); return c ? lineIntegrals(this.F(), c).flux : NaN; }
  /** Counter-clockwise circulation of F around the loop. */
  circulation() { const c = this.curve(); return c ? lineIntegrals(this.F(), c).circulation : NaN; }
  /** Both integrals at once: {flux, circulation, length}. */
  integrals() { const c = this.curve(); return c ? lineIntegrals(this.F(), c) : null; }
  /** Sum of strengths inside the loop: {q (Gauss: flux = q/ε0 for charges), gamma (circulation), n}. */
  enclosed() {
    const c = this.curve(), out = { q: 0, gamma: 0, n: 0 }; if (!c) return out;
    const inside = (p) => (Array.isArray(c) ? pointInPoly(p, c) : Math.hypot(p[0] - c.x, p[1] - c.y) < c.r);
    for (const s of this.live()) if (inside([s.x, s.y])) { const k = strengthOf(s, this.o); out.q += k.q; out.gamma += k.gamma; out.n++; }
    return out;
  }
  // ---------------------------------------------------------------- field lines seeded by flux
  /** Field lines from the radial sources, n ∝ |strength|, plus explicit spec.seeds. → [{pts, reverse}] */
  fieldLines() {
    const s = this.s, o = this.o, src = this.live(), F = this.F(), sp = spaceOf(s), r0 = o.seedRadius ?? 7, stopR = o.stopRadius ?? 5;
    const radial = src.filter((x) => x.type !== 'vortex');
    const lines = [], arrivals = new Map(radial.map((x) => [x, []]));
    const order = radial.map((x) => [x, strengthOf(x, o).q]).filter(([, q]) => q !== 0).sort((a, b) => b[1] - a[1]);
    for (const [S, q] of order) {
      const n = Math.max(1, Math.round(o.lineDensity * Math.abs(q))), dir = q > 0 ? 1 : -1, arr = arrivals.get(S), dth = TAU / n;
      const off = (o.lineOffset ?? 0.5) * dth;
      for (let k = 0; k < n; k++) {
        const th = off + k * dth;
        if (arr.some((a) => Math.abs(Math.atan2(Math.sin(a - th), Math.cos(a - th))) < dth * 0.5)) continue;
        const x0 = S.x + r0 * Math.cos(th) / s.sx, y0 = S.y + r0 * Math.sin(th) / s.sy;
        let hit = null;
        const stop = (x, y, len) => {
          for (const T of radial) { if (T === S && len < 3 * r0) continue; if (Math.hypot((x - T.x) * s.sx, (y - T.y) * s.sy) < stopR) { hit = T; return 'sink'; } }
          return null;
        };
        const L = traceLine(F, x0, y0, sp, { dir, step: 2, stop, maxLen: o.maxLen ?? 5000 });
        L.pts.unshift([S.x, S.y]);
        if (hit) { L.pts.push([hit.x, hit.y]); const p = L.pts[L.pts.length - 3] || L.pts[L.pts.length - 2]; arrivals.get(hit)?.push(Math.atan2((p[1] - hit.y) * s.sy, (p[0] - hit.x) * s.sx)); }
        lines.push({ pts: L.pts, reverse: dir < 0 });
      }
    }
    for (const p of o.seeds || []) {
      const f = traceLine(F, p[0], p[1], sp, { dir: 1, step: 2 }), b = traceLine(F, p[0], p[1], sp, { dir: -1, step: 2 });
      lines.push({ pts: b.pts.slice(1).reverse().concat(f.pts), reverse: false });
    }
    return lines;
  }
  // ---------------------------------------------------------------- draw
  /** Draw every enabled layer. Per-call overrides: draw({heat:'magnitude', lines:false, …}). */
  draw(over = {}) {
    const s = this.s, api = this.api, o = { ...this.o, ...over }, src = this.live(), F = this.F(), sp = spaceOf(s);
    if (this.loop?.sync) this.loop.sync();
    const theme = api.rgb('panel').join(','), skey = src.map((q) => `${q.x.toFixed(5)},${q.y.toFixed(5)}`).join(';') + '|' + JSON.stringify(val(o.uniform) || 0);
    // heat map
    if (o.heat) {
      const kind = o.heat === true ? 'potential' : o.heat;
      if (kind === 'potential' || kind === 'stream') {
        const f = kind === 'stream' ? (x, y) => this.stream(x, y) : (x, y) => this.potential(x, y);
        const G = gridOf(f, sp, 60, 40), lv = niceLevels(G, 10, 0.06, true), m = Math.max(1e-12, Math.abs(lv[0] ?? 1), Math.abs(lv[lv.length - 1] ?? 1));
        const ramp = signedRamp(api, o.heatPos || 'red', o.heatNeg || 'blue', o.heatStrength ?? 0.55);
        s.raster((x, y) => { const v = f(x, y); return isFinite(v) ? ramp(Math.tanh(v / m)) : null; }, { res: o.heatRes ?? 3, key: `fh|${kind}|${skey}|${theme}`, id: 'fields-heat' });
      } else {
        const P = api.rgb('panel'), C = api.rgb(o.heatColor || 'orange'), G = gridOf((x, y) => Math.hypot(...F(x, y)), sp, 60, 40);
        const vals = Array.from(G.z).filter((x) => isFinite(x) && x > 0).sort((a, b) => a - b), lo = Math.log(vals[Math.floor(vals.length * 0.05)] || 1e-9), hi = Math.log(vals[Math.floor(vals.length * 0.95)] || 1);
        const k0 = o.heatStrength ?? 0.6;
        s.raster((x, y) => { const m = Math.hypot(...F(x, y)); if (!isFinite(m)) return null; const t = k0 * clamp((Math.log(m) - lo) / (hi - lo || 1), 0, 1); return [P[0] + (C[0] - P[0]) * t, P[1] + (C[1] - P[1]) * t, P[2] + (C[2] - P[2]) * t]; }, { res: o.heatRes ?? 3, key: `fm|${skey}|${theme}`, id: 'fields-heat' });
      }
      if (s.o.axes) s.axes();
    }
    if (o.arrows) arrowField(s, api, F, { spacing: o.arrowSpacing ?? 30, color: o.arrowColor || 'muted', alpha: 0.55 });
    // equipotentials / stream-function contours
    const cont = (fn, opt, sym) => {
      const G = gridOf(fn, sp, Math.max(40, Math.round(s.W / 4)), Math.max(30, Math.round(s.H / 4)));
      const levels = Array.isArray(opt.levels) ? opt.levels : niceLevels(G, opt.n ?? 14, 0.05, sym);
      for (const lv of levels) {
        const col = opt.color || (lv > 1e-12 ? 'red' : lv < -1e-12 ? 'blue' : 'muted');
        for (const line of isolines(G, lv, { fn })) s.path(line, { color: col, width: opt.width ?? 1.1, alpha: opt.alpha ?? 0.55, dash: lv === 0 ? [4, 4] : null });
      }
    };
    if (o.equipotentials) cont((x, y) => this.potential(x, y), typeof o.equipotentials === 'object' ? o.equipotentials : {}, true);
    if (o.streamFunction) cont((x, y) => this.stream(x, y), typeof o.streamFunction === 'object' ? o.streamFunction : { color: 'muted' }, false);
    // streamlines
    if (o.streamlines) {
      const avoid = src.map((q) => [q.x, q.y, 9]);
      const SL = streamlines(F, sp, { sep: o.streamSep ?? 24, avoid, seeds: o.streamSeeds });
      for (const L of SL) arrowPath(s, api, L.pts, { color: o.streamColor || 'muted', width: 1.2, alpha: 0.75, head: 6.5 });
    }
    // field lines
    if (o.lines && !o.streamlines) {
      const lines = this.fieldLines();
      for (const L of lines) arrowPath(s, api, L.pts, { color: o.lineColor || 'ink', width: o.lineWidth ?? 1.4, alpha: o.lineAlpha ?? 0.75, reverse: L.reverse, head: 7, every: o.arrowEvery ?? 'mid' });
    }
    // loop
    if (this.loop) this._drawLoop(F, o);
    return this;
  }
  _drawLoop(F, o) {
    const s = this.s, api = this.api, L = this.loop, col = L.color, c = this.curve();
    const pts = Array.isArray(c) ? c : circlePts(c.x, c.y, c.r, 160);
    s.poly(pts, { color: col, width: 2.2, fill: col, fillAlpha: 0.07 });
    const mode = o.loopArrows; if (!mode || mode === 'none') return;
    // sample points evenly by arclength, draw the normal (or tangential) component of F there
    const per = []; let tot = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; per.push(tot); tot += Math.hypot((q[0] - p[0]) * s.sx, (q[1] - p[1]) * s.sy); }
    const n = clamp(Math.round(tot / 34), 8, 36); const samp = [];
    let A = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; A += p[0] * q[1] - q[0] * p[1]; }
    const sg = A >= 0 ? 1 : -1;
    for (let k = 0; k < n; k++) {
      const target = (k + 0.5) * tot / n; let i = 0; while (i + 1 < per.length && per[i + 1] <= target) i++;
      const p = pts[i], q = pts[(i + 1) % pts.length], segL = Math.hypot((q[0] - p[0]) * s.sx, (q[1] - p[1]) * s.sy) || 1, t = (target - per[i]) / segL;
      const x = p[0] + t * (q[0] - p[0]), y = p[1] + t * (q[1] - p[1]), tx = (q[0] - p[0]) * s.sx / segL * sg, ty = (q[1] - p[1]) * s.sy / segL * sg; // px tangent (ccw), y up
      samp.push([x, y, tx, ty]);
    }
    const vals = samp.map(([x, y, tx, ty]) => { const [u, w] = F(x, y), U = u * s.sx, W = w * s.sy; return mode === 'tangent' ? (U * tx + W * ty) : (U * ty - W * tx); });
    const mx = Math.max(1e-12, ...vals.map(Math.abs).filter(isFinite)), c2 = s.ctx;
    c2.save(); c2.lineWidth = 1.8; c2.lineCap = 'round';
    samp.forEach(([x, y, tx, ty], k) => {
      const v = vals[k]; if (!isFinite(v)) return; const len = 22 * Math.sqrt(Math.abs(v) / mx); if (len < 2) return;
      const dx = mode === 'tangent' ? tx : ty, dy = mode === 'tangent' ? ty : -tx; // px direction (y up)
      const sgn = Math.sign(v), X = s.X(x), Y = s.Y(y), X2 = X + sgn * dx * len, Y2 = Y - sgn * dy * len;
      const cc = api.color(mode === 'tangent' ? (sgn > 0 ? 'green' : 'red') : (sgn > 0 ? 'green' : 'red'), 0.9);
      c2.strokeStyle = c2.fillStyle = cc; c2.beginPath(); c2.moveTo(X, Y); c2.lineTo(X2 - sgn * dx * 3, Y2 + sgn * dy * 3); c2.stroke(); arrowHead(c2, X2, Y2, sgn * dx, -sgn * dy, 6.5);
    });
    c2.restore();
  }
  /** Legend entries for the layers in use (pass to v.legend, optionally with extra entries). */
  legend(extra = []) {
    const o = this.o, items = [];
    if (o.lines && !o.streamlines) items.push([o.lineColor || 'ink', 'field lines']);
    if (o.streamlines) items.push([o.streamColor || 'muted', 'streamlines']);
    if (o.equipotentials) items.push(['red', 'equipotentials ($\\varphi > 0$ red, $< 0$ blue)']);
    if (o.streamFunction) items.push(['muted', 'level sets of $\\psi$']);
    if (this.loop) items.push([this.loop.color, o.loopArrows === 'tangent' ? 'loop (arrows: tangential component)' : o.loopArrows && o.loopArrows !== 'none' ? 'loop (arrows: normal component, out green / in red)' : 'loop']);
    this.api.legend([...items, ...extra]); return items;
  }
}

export default function fields(api, rt, stage, spec) { return new Fields(api, rt, stage, spec); }
