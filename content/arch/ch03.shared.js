// Architecture & Structural Form — Chapter 3: helpers shared by ch03.js and ch03-b.js (plain named exports).
//
// Re-exports the chapter 1 helpers, then adds a masonry-arch engine in the spirit of Heyman's limit analysis:
// an arch ring cut into voussoirs by joints; a thrust line is statically admissible when the resultant force crosses
// every joint inside the stone. For a left reaction (H, V0) and couple m0 the moment about any point of a joint is
// linear in (H, V0, m0, load factor), so "the thrust line lies inside the masonry" is a set of linear inequalities and
// the minimum and maximum thrust, the collapse load factor, the minimum thickness are small linear programs (solved here
// through their dual with a tiny exact simplex).
export * from './ch01.shared.js';

const cross = (a, b) => a[0] * b[1] - a[1] * b[0];

// ── arch geometry ───────────────────────────────────────────────────────────────────────────────────────────────────
function polyAreaCentroid(P) {
  let A = 0, cx = 0, cy = 0;
  for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length], w = p[0] * q[1] - q[0] * p[1]; A += w; cx += (p[0] + q[0]) * w; cy += (p[1] + q[1]) * w; }
  A /= 2; return { area: Math.abs(A), cx: cx / (6 * A), cy: cy / (6 * A) };
}
/** Assemble an arch from joints [{a (intrados end), b (extrados end), tau (travel direction)}] and per-block outlines. */
function assemble(joints, polys, gamma) {
  const blocks = polys.map((poly, k) => { const g = polyAreaCentroid(poly); return { poly, area: g.area, W: g.area * gamma, cx: g.cx, cy: g.cy, k }; });
  const xs = joints.map((j) => j.b[0]);
  return { joints, blocks, gamma, N: blocks.length, W: blocks.reduce((s, b) => s + b.W, 0), c0: [(joints[0].a[0] + joints[0].b[0]) / 2, (joints[0].a[1] + joints[0].b[1]) / 2], xs };
}
const arcPts = (C, r, a0, a1, n = 2) => Array.from({ length: n }, (_, i) => { const t = a0 + ((a1 - a0) * (i + 1)) / (n + 1); return [C[0] + r * Math.cos(t), C[1] + r * Math.sin(t)]; });
/**
 * Circular or two-centred (pointed) arch with radial joints. R = mean radius, t = thickness, e = eccentricity of the two
 * centres (0 = round), alpha = embrace angle (pi/2: springing on the centre line), N = number of voussoirs (even),
 * crown: optional {keystone: 0..1} widens... (not used). Joint 0 is the left springing, joint N the right one.
 */
export function arch({ R = 1, t = 0.2, e = 0, alpha = Math.PI / 2, N = 30, gamma = 22 } = {}) {
  const half = N / 2, ths = Math.PI / 2 + alpha, yc = e === 0 ? -R * Math.cos(alpha) : 0, C = [e, e === 0 ? yc : 0];
  const ri = R - t / 2, ro = R + t / 2, thAp = (r) => Math.acos(Math.max(-1, Math.min(1, -e / r)));
  // left joints: angles from springing to apex (apex joint is vertical, from the x = 0 crossings)
  const left = [];
  for (let i = 0; i <= half; i++) {
    const th = ths + (thAp(R) - ths) * (i / half);
    if (i < half) left.push({ th, a: [C[0] + ri * Math.cos(th), C[1] + ri * Math.sin(th)], b: [C[0] + ro * Math.cos(th), C[1] + ro * Math.sin(th)], tau: [Math.sin(th), -Math.cos(th)] });
    else left.push({ th, a: [0, C[1] + Math.sqrt(Math.max(0, ri * ri - e * e))], b: [0, C[1] + Math.sqrt(ro * ro - e * e)], tau: [1, 0] });
  }
  const mir = (j) => ({ th: Math.PI - j.th, a: [-j.a[0], j.a[1]], b: [-j.b[0], j.b[1]], tau: [j.tau[0], -j.tau[1]], mirror: true });
  const joints = [...left, ...left.slice(0, half).reverse().map(mir)];
  const polys = [];
  const ang = (p) => Math.atan2(p[1] - C[1], p[0] - C[0]);
  for (let k = 0; k < N; k++) {
    const j0 = joints[k], j1 = joints[k + 1], m = k >= half; // mirrored blocks: build via mirroring the left block
    if (!m) {
      const ai = arcPts(C, ri, ang(j0.a), ang(j1.a)), ao = arcPts(C, ro, ang(j0.b), ang(j1.b));
      polys.push([j0.a, ...ai, j1.a, j1.b, ...ao.slice().reverse(), j0.b]);
    } else {
      const L = polys[N - 1 - k]; polys.push(L.map((p) => [-p[0], p[1]]).reverse());
    }
  }
  const g = assemble(joints, polys, gamma);
  Object.assign(g, { R, t, e, alpha, ri, ro, C, half, span: joints[N].a[0] - joints[0].a[0], rise: joints[half].a[1] - joints[0].a[1] });
  return g;
}
/** Arch from a mean line (list of [x, y] joint centres from left to right), constant thickness t, normals by central differences. */
export function archFromLine(pts, t, gamma = 22) {
  const n = pts.length, joints = pts.map((p, i) => {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)], dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy), tau = [dx / L, dy / L], nn = [-tau[1], tau[0]];
    return { a: [p[0] - nn[0] * t / 2, p[1] - nn[1] * t / 2], b: [p[0] + nn[0] * t / 2, p[1] + nn[1] * t / 2], tau };
  });
  const polys = []; for (let k = 0; k < n - 1; k++) polys.push([joints[k].a, joints[k + 1].a, joints[k + 1].b, joints[k].b]);
  const g = assemble(joints, polys, gamma); Object.assign(g, { t, half: (n - 1) / 2, span: pts[n - 1][0] - pts[0][0] }); return g;
}
/** Index of the block whose extrados span contains x (clamped). */
export function blockAt(g, x) {
  let best = 0, bd = Infinity;
  for (let k = 0; k < g.N; k++) { const x0 = g.joints[k].b[0], x1 = g.joints[k + 1].b[0], lo = Math.min(x0, x1), hi = Math.max(x0, x1); if (x >= lo && x <= hi) return k; const d = Math.min(Math.abs(x - lo), Math.abs(x - hi)); if (d < bd) { bd = d; best = k; } }
  return best;
}
/** Extrados height at x (linear between joint ends). */
export function extradosY(g, x) {
  const k = blockAt(g, x), A = g.joints[k].b, B = g.joints[k + 1].b, f = Math.abs(B[0] - A[0]) < 1e-9 ? 0 : (x - A[0]) / (B[0] - A[0]);
  return A[1] + (B[1] - A[1]) * Math.max(0, Math.min(1, f));
}

// ── linear programming: min c·x s.t. A x ≤ b, x free (n = 3 or 4), through the dual and a Bland simplex ─────────────────
export function lpMin(c, A, b) {
  const n = c.length, m = A.length, eps = 1e-10;
  // normalise rows
  const An = [], bn = [];
  for (let i = 0; i < m; i++) { const nr = Math.hypot(...A[i]) || 1; An.push(A[i].map((q) => q / nr)); bn.push(b[i] / nr); }
  // dual: min b·y s.t. A^T y = -c, y ≥ 0. Tableau columns: y_1..y_m, art_1..art_n, rhs
  const sgn = c.map((q) => (-q < 0 ? -1 : 1)), W = m + n + 1;
  const T = Array.from({ length: n }, (_, i) => { const row = new Float64Array(W); for (let j = 0; j < m; j++) row[j] = sgn[i] * An[j][i]; row[m + i] = 1; row[W - 1] = sgn[i] * -c[i]; return row; });
  const basis = Array.from({ length: n }, (_, i) => m + i);
  const cost = (ph) => { const z = new Float64Array(W - 1); for (let j = 0; j < W - 1; j++) z[j] = ph === 1 ? (j >= m ? 1 : 0) : (j < m ? bn[j] : 0); return z; };
  const run = (ph) => {
    const cst = cost(ph);
    for (let it = 0; it < 4000; it++) {
      let enter = -1, zval = 0;
      for (let j = 0; j < (ph === 1 ? W - 1 : m); j++) {
        let z = cst[j]; for (let i = 0; i < n; i++) z -= cst[basis[i]] * T[i][j];
        if (z < -eps) { enter = j; zval = z; break; }
      }
      if (enter < 0) return 'opt';
      let row = -1, best = Infinity;
      for (let i = 0; i < n; i++) if (T[i][enter] > eps) { const r = T[i][W - 1] / T[i][enter]; if (r < best - 1e-12 || (Math.abs(r - best) <= 1e-12 && basis[i] < basis[row])) { best = r; row = i; } }
      if (row < 0) return 'unbounded';
      const pv = T[row][enter]; for (let j = 0; j < W; j++) T[row][j] /= pv;
      for (let i = 0; i < n; i++) if (i !== row) { const f = T[i][enter]; if (f) for (let j = 0; j < W; j++) T[i][j] -= f * T[row][j]; }
      basis[row] = enter;
    }
    return 'cycle';
  };
  const r1 = run(1);
  let ph1 = 0; for (let i = 0; i < n; i++) if (basis[i] >= m) ph1 += T[i][W - 1];
  if (r1 !== 'opt' || ph1 > 1e-8) return null; // dual infeasible: primal unbounded
  // drive artificials out of the basis
  for (let i = 0; i < n; i++) if (basis[i] >= m) {
    let pj = -1; for (let j = 0; j < m; j++) if (Math.abs(T[i][j]) > 1e-9) { pj = j; break; }
    if (pj < 0) continue;
    const pv = T[i][pj]; for (let j = 0; j < W; j++) T[i][j] /= pv;
    for (let k = 0; k < n; k++) if (k !== i) { const f = T[k][pj]; if (f) for (let j = 0; j < W; j++) T[k][j] -= f * T[i][j]; }
    basis[i] = pj;
  }
  const r2 = run(2);
  if (r2 !== 'opt') return null; // dual unbounded: primal infeasible
  const cst = cost(2), x = new Array(n);
  for (let i = 0; i < n; i++) { let z = 0; for (let k = 0; k < n; k++) z -= cst[basis[k]] * T[k][m + i]; x[i] = -z * sgn[i]; }
  return { x, val: c.reduce((s, q, i) => s + q * x[i], 0) };
}
/** Brute-force vertex enumeration (for tests). */
export function lpBrute(c, A, b) {
  const n = c.length, m = A.length; let best = null;
  const solveN = (rows) => { const M = rows.map((r) => [...A[r], b[r]]); for (let i = 0; i < n; i++) { let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r; if (Math.abs(M[p][i]) < 1e-12) return null; [M[i], M[p]] = [M[p], M[i]]; for (let r = 0; r < n; r++) if (r !== i) { const f = M[r][i] / M[i][i]; for (let k = i; k <= n; k++) M[r][k] -= f * M[i][k]; } } return M.map((r, i) => r[n] / r[i]); };
  const idx = []; const rec = (s) => { if (idx.length === n) { const x = solveN(idx); if (!x) return; if (A.every((r, i) => r.reduce((acc, q, k) => acc + q * x[k], 0) <= b[i] + 1e-7)) { const v = c.reduce((acc, q, k) => acc + q * x[k], 0); if (!best || v < best.val) best = { x, val: v }; } return; } for (let i = s; i < m; i++) { idx.push(i); rec(i + 1); idx.pop(); } };
  rec(0); return best;
}

// ── thrust-line constraints ─────────────────────────────────────────────────────────────────────────────────────────
/**
 * Linear constraints for a statically admissible thrust line. Unknowns u = [H, V0, m0, lam]: the support reaction on the
 * left springing is the force (H, V0) at the centre of joint 0 plus the couple m0 (counter-clockwise); lam multiplies the
 * loads flagged `var`. loads: [{x, P, var?}] vertical downward point loads on the extrados.
 * opts: inset (per joint distance by which the admissible part of the joint is shortened at both ends; negative widens it),
 * mu (friction coefficient: adds |F·joint| ≤ mu F·normal), fixed (set of joint indices to skip), from/to (joint range).
 */
export function thrustRows(g, loads = [], opts = {}) {
  const { inset, mu = Infinity, from = 0, to = g.N } = opts, rows = [];
  const lb = loads.map((l) => ({ ...l, k: l.k ?? blockAt(g, l.x) }));
  const c0 = g.c0;
  for (let j = from; j <= to; j++) {
    const J = g.joints[j], d = [J.b[0] - J.a[0], J.b[1] - J.a[1]], dl = Math.hypot(...d), dh = [d[0] / dl, d[1] / dl], ins = inset ? (typeof inset === 'number' ? inset : typeof inset === 'function' ? inset(j) : inset[j] || 0) : 0;
    const ends = [[J.a[0] + dh[0] * ins, J.a[1] + dh[1] * ins], [J.b[0] - dh[0] * ins, J.b[1] - dh[1] * ins]];
    const s = -cross(d, J.tau) >= 0 ? 1 : -1;
    const coef = ends.map((p) => {
      let cst = 0, cl = 0;
      for (let k = 0; k < j; k++) cst -= g.blocks[k].W * (g.blocks[k].cx - p[0]);
      for (const l of lb) if (l.k < j) { if (l.var) cl -= l.P * (l.x - p[0]); else cst -= l.P * (l.x - p[0]); }
      return { c: [-(c0[1] - p[1]), c0[0] - p[0], 1, cl], cst };
    });
    // s > 0: M(a) ≤ 0 ≤ M(b); s < 0: the reverse
    const [A, B] = coef;
    if (s > 0) { rows.push({ c: A.c, d: -A.cst, j, side: 'a' }); rows.push({ c: B.c.map((q) => -q), d: B.cst, j, side: 'b' }); }
    else { rows.push({ c: A.c.map((q) => -q), d: A.cst, j, side: 'a' }); rows.push({ c: B.c, d: -B.cst, j, side: 'b' }); }
    if (Number.isFinite(mu)) {
      // force on the cut: F = (H, V0 - sum of weights/loads to the left); normal = tau, along-joint = dh
      let wsum = 0, wl = 0; for (let k = 0; k < j; k++) wsum += g.blocks[k].W;
      for (const l of lb) if (l.k < j) { if (l.var) wl += l.P; else wsum += l.P; }
      // F·dh = H dh0 + (V0 - wsum - lam wl) dh1 ; F·tau likewise
      const Fd = { c: [dh[0], dh[1], 0, -dh[1] * wl], k: -dh[1] * wsum }, Ft = { c: [J.tau[0], J.tau[1], 0, -J.tau[1] * wl], k: -J.tau[1] * wsum };
      rows.push({ c: Fd.c.map((q, i) => q - mu * Ft.c[i]), d: -(Fd.k - mu * Ft.k), j, side: 'slide+' });
      rows.push({ c: Fd.c.map((q, i) => -q - mu * Ft.c[i]), d: -(-Fd.k - mu * Ft.k), j, side: 'slide-' });
    }
  }
  return rows;
}
/** Solve min c·u over the thrust constraints (u = [H, V0, m0] or with lam); extra rows may be appended. */
export function thrustLP(g, loads, c, opts = {}) {
  const nv = c.length, rows = thrustRows(g, loads, opts), big = 60 * (g.W + loads.reduce((s, l) => s + l.P * (l.var ? (opts.lamMax ?? 5) : 1), 0)) + 1, bigM = big * (g.span || 2) * 3;
  const A = [], b = [];
  const add = (cc, dd) => { A.push(cc.slice(0, nv)); b.push(dd); };
  for (const r of rows) add(r.c, r.d);
  add([-1, 0, 0, 0], 0); add([1, 0, 0, 0], big); add([0, 1, 0, 0], big); add([0, -1, 0, 0], big); add([0, 0, 1, 0], bigM); add([0, 0, -1, 0], bigM);
  if (nv === 4) { add([0, 0, 0, -1], opts.lamMin ?? 0); add([0, 0, 0, 1], opts.lamMax ?? 5); }
  if (opts.extra) for (const r of opts.extra) add(r.c, r.d);
  const res = lpMin(c, A, b);
  if (res) res.rows = rows;
  return res;
}
/** Min and max horizontal thrust: {min: u, max: u} or null when no thrust line fits. */
export function thrustRange(g, loads = [], opts = {}) {
  const lo = thrustLP(g, loads, [1, 0, 0], opts); if (!lo) return null;
  const hi = thrustLP(g, loads, [-1, 0, 0], opts);
  return { min: lo.x, max: hi ? hi.x : lo.x, Hmin: lo.x[0], Hmax: hi ? hi.x[0] : lo.x[0] };
}
/** Thrust line for the reaction u = [H, V0, m0]: per joint the crossing parameter t (0 intrados, 1 extrados), the point and the force. */
export function thrustLine(g, loads, u) {
  const rows = thrustRows(g, loads, {}), out = [];
  const lb = loads.map((l) => ({ ...l, k: l.k ?? blockAt(g, l.x) }));
  let wsum = 0, ws = 0;
  for (let j = 0; j <= g.N; j++) {
    const J = g.joints[j];
    const Mof = (p) => { let M = u[2] + (g.c0[0] - p[0]) * u[1] - (g.c0[1] - p[1]) * u[0]; for (let k = 0; k < j; k++) M -= g.blocks[k].W * (g.blocks[k].cx - p[0]); for (const l of lb) if (l.k < j) M -= l.P * (l.x - p[0]) * (l.var ? (u[3] ?? 1) : 1); return M; };
    const Ma = Mof(J.a), Mb = Mof(J.b), t = Math.abs(Ma - Mb) < 1e-14 ? 0.5 : Ma / (Ma - Mb);
    const left = g.blocks.slice(0, j).reduce((s, b) => s + b.W, 0) + lb.reduce((s, l) => s + (l.k < j ? l.P * (l.var ? (u[3] ?? 1) : 1) : 0), 0);
    out.push({ j, t, p: [J.a[0] + t * (J.b[0] - J.a[0]), J.a[1] + t * (J.b[1] - J.a[1])], F: [u[0], u[1] - left], inside: t >= -1e-6 && t <= 1 + 1e-6, Ma, Mb });
  }
  return out;
}
/** Hinges (joint, side) = constraints active at the solution within tol. */
export function hinges(g, loads, u, opts = {}, tol = 1e-6) {
  const rows = thrustRows(g, loads, opts), out = [], nv = u.length;
  for (const r of rows) {
    if (!opts.all && r.side !== 'a' && r.side !== 'b') continue;
    const nr = Math.hypot(...r.c.slice(0, nv)) || 1, slack = (r.d - r.c.slice(0, nv).reduce((s, q, i) => s + q * u[i], 0)) / nr;
    if (Math.abs(slack) < tol * (1 + g.W)) out.push({ j: r.j, side: r.side });
  }
  return out;
}
/** Smallest thickness at which a thrust line still fits (bisection), with the geometry built by make(t). */
export function minThickness(make, loads = (g) => [], opts = {}, lo = 1e-4, hi = 1.0, it = 34) {
  const ok = (t) => { const g = make(t); return !!thrustLP(g, loads(g), [1, 0, 0], opts); };
  if (!ok(hi)) return null;
  for (let i = 0; i < it; i++) { const mid = (lo + hi) / 2; if (ok(mid)) hi = mid; else lo = mid; }
  return hi;
}
/** Collapse load factor of the loads flagged `var` (maximise lam subject to the thrust constraints); null if the arch cannot stand unloaded. */
export function collapseFactor(g, loads, opts = {}) {
  const r = thrustLP(g, loads, [0, 0, 0, -1], { ...opts, lamMax: opts.lamMax ?? 60 });
  return r ? { lam: r.x[3], u: r.x } : null;
}


/** Round or segmental arch whose crown is a keystone block of angular width key (rad): 2*nSide + 1 voussoirs, block nSide is the keystone. */
export function archKey({ R = 1, t = 0.2, alpha = Math.PI / 2, nSide = 7, key = 0.2, gamma = 22 } = {}) {
  const ths = Math.PI / 2 + alpha, yc = -R * Math.cos(alpha), C = [0, yc], ri = R - t / 2, ro = R + t / 2;
  const left = []; for (let i = 0; i <= nSide; i++) { const th = ths + (Math.PI / 2 + key / 2 - ths) * (i / nSide); left.push({ th, a: [ri * Math.cos(th), yc + ri * Math.sin(th)], b: [ro * Math.cos(th), yc + ro * Math.sin(th)], tau: [Math.sin(th), -Math.cos(th)] }); }
  const mir = (j) => ({ th: Math.PI - j.th, a: [-j.a[0], j.a[1]], b: [-j.b[0], j.b[1]], tau: [j.tau[0], -j.tau[1]] });
  const joints = [...left, ...left.slice().reverse().map(mir)], N = 2 * nSide + 1, ang = (p) => Math.atan2(p[1] - yc, p[0]);
  const polys = [];
  for (let k = 0; k < N; k++) {
    if (k < nSide) { const j0 = joints[k], j1 = joints[k + 1]; polys.push([j0.a, ...arcPts(C, ri, ang(j0.a), ang(j1.a)), j1.a, j1.b, ...arcPts(C, ro, ang(j0.b), ang(j1.b)).reverse(), j0.b]); }
    else if (k === nSide) { const j0 = joints[k], j1 = joints[k + 1]; polys.push([j0.a, ...arcPts(C, ri, ang(j0.a), ang(j1.a), 3), j1.a, j1.b, ...arcPts(C, ro, ang(j0.b), ang(j1.b), 3).reverse(), j0.b]); }
    else polys.push(polys[N - 1 - k].map((p) => [-p[0], p[1]]).reverse());
  }
  const g = assemble(joints, polys, gamma);
  Object.assign(g, { R, t, e: 0, alpha, ri, ro, C, half: nSide, keyBlock: nSide, span: joints[N].a[0] - joints[0].a[0], rise: joints[nSide].a[1] - joints[0].a[1] });
  return g;
}
/** Coefficients of the moment about point p of joint j: M = cH H + cV V0 + m0 + cst + cl lam. */
export function momentCoef(g, lb, j, p) {
  let cst = 0, cl = 0;
  for (let k = 0; k < j; k++) cst -= g.blocks[k].W * (g.blocks[k].cx - p[0]);
  for (const l of lb) if ((l.k ?? blockAt(g, l.x)) < j) { if (l.var) cl -= l.P * (l.x - p[0]); else cst -= l.P * (l.x - p[0]); }
  return { cH: -(g.c0[1] - p[1]), cV: g.c0[0] - p[0], cst, cl };
}
/** Reaction u = [H, V0, m0, lam] of the thrust line through two points [j, [x, y]], for a given V0 and load factor. */
export function solveU(g, loads, V0, A, B, lam = 1) {
  const a = momentCoef(g, loads, A[0], A[1]), b = momentCoef(g, loads, B[0], B[1]);
  const H = -((a.cV - b.cV) * V0 + (a.cst - b.cst) + lam * (a.cl - b.cl)) / (a.cH - b.cH);
  return [H, V0, -(a.cH * H + a.cV * V0 + a.cst + lam * a.cl), lam];
}
/** Total vertical load of the arch and its loads at load factor lam. */
export const totalLoad = (g, loads, lam = 1) => g.W + loads.reduce((s, l) => s + l.P * (l.var ? lam : 1), 0);
/** Reaction (H, V0, m0) of a thrust line through end point p0 of joint 0 and p1 of joint N, with horizontal thrust H. */
export function uFromEnds(g, loads, p0, p1, H, lam = 1) {
  const lb = loads.map((l) => ({ ...l, k: l.k ?? blockAt(g, l.x) }));
  // moment about p1 of: reaction force (H, V0) at p0, plus weights and loads (all to the left of joint N)
  let M = 0; for (const b of g.blocks) M -= b.W * (b.cx - p1[0]); for (const l of lb) M -= l.P * (l.var ? lam : 1) * (l.x - p1[0]);
  // (p0 - p1) x (H, V0) + M = 0  ->  (p0x - p1x) V0 - (p0y - p1y) H + M = 0
  const dx = p0[0] - p1[0], dy = p0[1] - p1[1], V = (-M + dy * H) / dx;
  const m0 = (p0[0] - g.c0[0]) * V - (p0[1] - g.c0[1]) * H;
  return [H, V, m0, lam];
}
/** Smallest thickness scale with a thrust line, and the thrust at that state: {t, g, u} (u from the min-H solution). */
export function bestFit(make, loads, opts = {}, lo = 1e-3, hi = 3, it = 28) {
  let best = null;
  const ok = (t) => { const g = make(t), L = loads(g), r = thrustLP(g, L, [1, 0, 0], opts); if (r) best = { t, g, loads: L, u: r.x }; return !!r; };
  if (!ok(hi)) return null;
  let a = lo, b = hi; for (let i = 0; i < it; i++) { const m = (a + b) / 2; if (ok(m)) b = m; else a = m; }
  ok(b); return best;
}

/** The most central admissible thrust line: the reaction maximising the distance kept from both edges of every joint. {u, eps} (null if none fits). */
export function centralLine(g, loads, opts = {}, it = 22) {
  const first = thrustLP(g, loads, [1, 0, 0], { ...opts, inset: 0 }); if (!first) return null;
  let u = first.x, eps = 0, lo = 0, hi = (g.t || 0.2) / 2 + 1e-9;
  for (let i = 0; i < it; i++) { const mid = (lo + hi) / 2, r = thrustLP(g, loads, [1, 0, 0], { ...opts, inset: mid }); if (r) { u = r.x; eps = mid; lo = mid; } else hi = mid; }
  return { u, eps };
}

// ── drawing helpers ─────────────────────────────────────────────────────────────────────────────────────────────────
/** Draw the voussoirs. opts: fill colour, alt (alternate shading), keystone index, mask (blocks to omit), tf (point transform per block). */
export function drawArch(v, s, g, o = {}) {
  const { color = 'muted', ink = 'ink', skip = () => false, tfBlock, fillAlpha = 0.16, joints = true } = o;
  g.blocks.forEach((b, k) => {
    if (skip(k)) return;
    const P = tfBlock ? b.poly.map((p) => tfBlock(k, p)) : b.poly;
    s.poly(P, { fill: o.blockColor ? o.blockColor(k) : color, fillAlpha: fillAlpha + (k % 2 ? 0.07 : 0), color: ink, width: joints ? 1 : 0.6, alpha: 0.85 });
  });
}
/** Draw a thrust line (list from thrustLine) in two colours: inside the masonry and outside it. */
export function drawThrust(v, s, tl, o = {}) {
  const { color = 'red', bad = 'orange', width = 2.4, dash } = o;
  for (let i = 0; i + 1 < tl.length; i++) { const A = tl[i], B = tl[i + 1], ok = A.inside && B.inside; s.line(A.p[0], A.p[1], B.p[0], B.p[1], { color: ok ? color : bad, width: ok ? width : width + 0.6, dash }); }
}
/** Rotate point p about c by angle a (counter-clockwise). */
export const rot = (p, c, a) => { const ca = Math.cos(a), sa = Math.sin(a), dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + ca * dx - sa * dy, c[1] + sa * dx + ca * dy]; };
/** Funicular (string polygon) of vertical loads between (0, ya) and (L, yb) for horizontal tension H; loads [{x, P}] sorted. */
export function funicular(loads, ya, yb, L, H) {
  const tot = loads.reduce((a, l) => a + l.P, 0), Rb = loads.reduce((a, l) => a + (l.P * l.x), 0) / L, Ra = tot - Rb;
  const xs = [0, ...loads.map((l) => l.x), L], ys = [ya]; let V = Ra, M = 0;
  for (let k = 1; k < xs.length; k++) { M += V * (xs[k] - xs[k - 1]); ys.push(ya + ((yb - ya) * xs[k]) / L - M / H); if (k - 1 < loads.length) V -= loads[k - 1].P; }
  ys[ys.length - 1] = yb;
  return { xs, ys };
}
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const f2 = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d).replace('-', '−') : '—');
