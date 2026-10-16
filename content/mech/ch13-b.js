// Classical Mechanics — Chapter 13: Nonlinear dynamics and chaos (part b: 13.9–13.16)

import { sciText, TAU, DEG, clamp, memo, sci, num, wrap, wrap0, pendStep, shoelace, makeLoop, drawCyl, piTicks, progressive, now, fastDots, fitLine, drawPendulum } from './ch13.shared.js';

// ── 13.9: the periodically forced pendulum  q'' = −sin q + ε sin Ωt  and its stroboscopic map ────────────────────
/** Flow of the forced pendulum from time t over a span T (may be negative) with N RK4 steps. */
function fpFlow(q, p, t, T, eps, W, N) {
  const h = T / N, f = (tt, qq) => -Math.sin(qq) + eps * Math.sin(W * tt);
  for (let i = 0; i < N; i++) {
    const k1q = p, k1p = f(t, q), k2q = p + (h / 2) * k1p, k2p = f(t + h / 2, q + (h / 2) * k1q), k3q = p + (h / 2) * k2p, k3p = f(t + h / 2, q + (h / 2) * k2q), k4q = p + h * k3p, k4p = f(t + h, q + h * k3q);
    q += (h / 6) * (k1q + 2 * k2q + 2 * k3q + k4q); p += (h / 6) * (k1p + 2 * k2p + 2 * k3p + k4p); t += h;
  }
  return [q, p];
}
/** Hyperbolic fixed point of the stroboscopic map near (q0, 0), with its eigenvalues and eigenvectors. */
function fpHyperbolic(P, q0, p0 = 0) {
  let q = q0, p = p0, J = null;
  for (let it = 0; it < 30; it++) {
    const f0 = P(q, p), d = 1e-7, fq = P(q + d, p), fp = P(q, p + d);
    J = [(fq[0] - f0[0]) / d, (fp[0] - f0[0]) / d, (fq[1] - f0[1]) / d, (fp[1] - f0[1]) / d];
    const a = J[0] - 1, b = J[1], c = J[2], e = J[3] - 1, r0 = f0[0] - q, r1 = f0[1] - p, det = a * e - b * c;
    let dq = (e * r0 - b * r1) / det, dp = (-c * r0 + a * r1) / det; const st = Math.hypot(dq, dp); if (st > 0.1) { dq *= 0.1 / st; dp *= 0.1 / st; }
    q -= dq; p -= dp; if (st < 1e-12) break;
  }
  const tr = J[0] + J[3], det = J[0] * J[3] - J[1] * J[2], disc = Math.sqrt(Math.max(0, tr * tr - 4 * det)), lu = (tr + disc) / 2, ls = (tr - disc) / 2;
  const vec = (l) => { const x = J[1], y = l - J[0], n = Math.hypot(x, y); return [x / n, y / n]; };
  return { q, p, lu, ls, vu: vec(lu), vs: vec(ls) };
}
/**
 * One branch of an invariant manifold of a fixed point x* of a map F: the images of the fundamental segment
 * x* + s v, s ∈ [s0, s0 λ), under F⁰…F^{k−1}, refined adaptively (a new parameter value is started from scratch
 * wherever two neighbours land farther apart than `tol` inside the window).
 */
function manifold(F, x0, v, lam, { k = 4, s0 = 2e-5, tol = 0.035, maxPts = 4000, inWin = () => true } = {}) {
  const at = (u) => { const n = Math.floor(u), s = s0 * lam ** (u - n); let z = [x0[0] + s * v[0], x0[1] + s * v[1]]; for (let i = 0; i < n; i++) z = F(z[0], z[1]); return z; };
  let U = [], Z = [];
  for (let i = 0; i <= k * 10; i++) { const u = i / 10; U.push(u); Z.push(at(u)); }
  for (let pass = 0; pass < 16 && U.length < maxPts; pass++) {
    const U2 = [U[0]], Z2 = [Z[0]]; let ins = 0;
    for (let i = 1; i < U.length; i++) {
      const a = Z[i - 1], b = Z[i];
      if (U.length + ins < maxPts && U[i] - U[i - 1] > 1e-9 && Math.hypot(a[0] - b[0], a[1] - b[1]) > tol && inWin(a, b)) { const um = (U[i - 1] + U[i]) / 2; U2.push(um); Z2.push(at(um)); ins++; }
      U2.push(U[i]); Z2.push(b);
    }
    U = U2; Z = Z2; if (!ins) break;
  }
  return Z;
}
/** Polyline with breaks (null) wherever neighbours are farther apart than `gap` (unrefined jumps). */
function broken(Z, gap, shift = 0) { const out = []; for (let i = 0; i < Z.length; i++) { if (i && Math.hypot(Z[i][0] - Z[i - 1][0], Z[i][1] - Z[i - 1][1]) > gap) out.push(null); out.push(shift ? [Z[i][0] + shift, Z[i][1]] : Z[i]); } return out; }
/** First crossing of the line q = qc (upward in q) along a polyline, with the interpolated p. */
function firstCross(Z, qc = 0) {
  for (let i = 1; i < Z.length; i++) { const a = Z[i - 1], b = Z[i]; if ((a[0] - qc) * (b[0] - qc) <= 0 && a[0] !== b[0]) { const f = (qc - a[0]) / (b[0] - a[0]); return a[1] + f * (b[1] - a[1]); } }
  return NaN;
}
/** Number of crossings between two polylines inside a window (bucketed segment tests). */
function countCrossings(A, B, win) {
  const cell = 0.12, grid = new Map(); let n = 0;
  const inside = (z) => z[0] >= win[0] && z[0] <= win[1] && z[1] >= win[2] && z[1] <= win[3];
  for (let i = 1; i < B.length; i++) {
    const a = B[i - 1], b = B[i]; if (!inside(a) && !inside(b)) continue;
    for (let x = Math.floor(Math.min(a[0], b[0]) / cell); x <= Math.floor(Math.max(a[0], b[0]) / cell); x++) for (let y = Math.floor(Math.min(a[1], b[1]) / cell); y <= Math.floor(Math.max(a[1], b[1]) / cell); y++) { const k = `${x},${y}`; if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); }
  }
  const seen = new Set();
  for (let i = 1; i < A.length; i++) {
    const p = A[i - 1], q = A[i]; if (!inside(p) && !inside(q)) continue;
    const cand = new Set(); for (let x = Math.floor(Math.min(p[0], q[0]) / cell); x <= Math.floor(Math.max(p[0], q[0]) / cell); x++) for (let y = Math.floor(Math.min(p[1], q[1]) / cell); y <= Math.floor(Math.max(p[1], q[1]) / cell); y++) for (const j of grid.get(`${x},${y}`) || []) cand.add(j);
    for (const j of cand) {
      const r = B[j - 1], s = B[j], d = (q[0] - p[0]) * (s[1] - r[1]) - (q[1] - p[1]) * (s[0] - r[0]); if (!d) continue;
      const t = ((r[0] - p[0]) * (s[1] - r[1]) - (r[1] - p[1]) * (s[0] - r[0])) / d, u = ((r[0] - p[0]) * (q[1] - p[1]) - (r[1] - p[1]) * (q[0] - p[0])) / d;
      if (t >= 0 && t < 1 && u >= 0 && u < 1 && !seen.has(`${i},${j}`)) { seen.add(`${i},${j}`); n++; }
    }
  }
  return n;
}

// ── 13.10–13.11: billiards ─────────────────────────────────────────────────────────────────────────────────────
/** Boundary made of segments and circular arcs (counter-clockwise, interior on the left), or an ellipse. */
function makeTable(name) {
  const P = [];
  const seg = (a, b) => P.push({ t: 'seg', a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) });
  const arc = (c, r, a0, a1) => P.push({ t: 'arc', c, r, a0, a1, len: r * (a1 - a0) });
  let area, ell = null, W = 0.36, Hs = 1.15, A = 0.62;
  if (name === 'circle') { arc([0, 0], 1, 0, TAU); area = Math.PI; }
  else if (name === 'ellipse') { ell = { a: 1.4, b: 0.85 }; area = Math.PI * 1.4 * 0.85; }
  else if (name === 'stadium') { arc([A, 0], 1, -Math.PI / 2, Math.PI / 2); seg([A, 1], [-A, 1]); arc([-A, 0], 1, Math.PI / 2, 1.5 * Math.PI); seg([-A, -1], [A, -1]); area = Math.PI + 4 * A; }
  else { arc([0, 0.3], 1, 0, Math.PI); seg([-1, 0.3], [-W, 0.3]); seg([-W, 0.3], [-W, 0.3 - Hs]); seg([-W, 0.3 - Hs], [W, 0.3 - Hs]); seg([W, 0.3 - Hs], [W, 0.3]); seg([W, 0.3], [1, 0.3]); area = Math.PI / 2 + 2 * W * Hs; }
  let L = 0;
  if (ell) { // arclength table for the ellipse, parametrised by ψ: (a cos ψ, b sin ψ)
    const n = 2000, cum = new Float64Array(n + 1);
    for (let i = 1; i <= n; i++) { const u = (TAU * (i - 0.5)) / n; cum[i] = cum[i - 1] + (TAU / n) * Math.hypot(ell.a * Math.sin(u), ell.b * Math.cos(u)); }
    ell.cum = cum; ell.n = n; L = cum[n];
  } else { for (const q of P) { q.s0 = L; L += q.len; } }
  const outline = [];
  if (ell) for (let i = 0; i <= 200; i++) outline.push([ell.a * Math.cos((TAU * i) / 200), ell.b * Math.sin((TAU * i) / 200)]);
  else for (const q of P) { if (q.t === 'seg') outline.push(q.a, q.b); else for (let i = 0; i <= 60; i++) { const u = q.a0 + ((q.a1 - q.a0) * i) / 60; outline.push([q.c[0] + q.r * Math.cos(u), q.c[1] + q.r * Math.sin(u)]); } }
  const inside = (x, y) => {
    if (ell) return (x / ell.a) ** 2 + (y / ell.b) ** 2 < 1;
    let c = false; for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) { const a = outline[i], b = outline[j]; if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) c = !c; } return c;
  };
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (const p of outline) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  return { name, P, ell, L, area, outline, inside, bbox: [x0, x1, y0, y1], W, Hs };
}
/** Next wall hit from (x, y) moving along unit d: returns {x, y, d (reflected), s (arclength), p (Birkhoff), piece}. */
function bounce(T, x, y, d, last) {
  let best = Infinity, hit = null;
  if (T.ell) {
    const { a, b } = T.ell, A = (d[0] / a) ** 2 + (d[1] / b) ** 2, B = 2 * ((x * d[0]) / (a * a) + (y * d[1]) / (b * b)), C = (x / a) ** 2 + (y / b) ** 2 - 1, D = B * B - 4 * A * C;
    if (D >= 0) { const t = (-B + Math.sqrt(D)) / (2 * A); if (t > 1e-9) { best = t; hit = { piece: 0 }; } }
  } else {
    T.P.forEach((q, k) => {
      if (q.t === 'seg') {
        if (k === last) return;
        const ex = q.b[0] - q.a[0], ey = q.b[1] - q.a[1], den = d[0] * ey - d[1] * ex; if (Math.abs(den) < 1e-14) return;
        const t = ((q.a[0] - x) * ey - (q.a[1] - y) * ex) / den, u = ((q.a[0] - x) * d[1] - (q.a[1] - y) * d[0]) / den;
        if (t > 1e-9 && u >= 0 && u <= 1 && t < best) { best = t; hit = { piece: k, u }; }
      } else {
        const ox = x - q.c[0], oy = y - q.c[1], B = ox * d[0] + oy * d[1], C = ox * ox + oy * oy - q.r * q.r, D = B * B - C; if (D < 0) return;
        for (const t of [-B - Math.sqrt(D), -B + Math.sqrt(D)]) {
          if (!(t > 1e-7) || t >= best) continue;
          let ang = Math.atan2(oy + t * d[1], ox + t * d[0]); while (ang < q.a0) ang += TAU; while (ang > q.a0 + TAU) ang -= TAU;
          if (ang <= q.a1 + 1e-12) { best = t; hit = { piece: k, ang }; }
        }
      }
    });
  }
  if (!hit) return null;
  const X = x + best * d[0], Y = y + best * d[1]; let n, tau, s;
  if (T.ell) {
    const { a, b } = T.ell; n = [-X / (a * a), -Y / (b * b)]; const nn = Math.hypot(n[0], n[1]); n = [n[0] / nn, n[1] / nn]; tau = [-n[1], n[0]];
    let psi = Math.atan2(Y / b, X / a); if (psi < 0) psi += TAU; const u = (psi / TAU) * T.ell.n, i = Math.min(T.ell.n - 1, Math.floor(u)); s = T.ell.cum[i] + (u - i) * (T.ell.cum[i + 1] - T.ell.cum[i]);
  } else {
    const q = T.P[hit.piece];
    if (q.t === 'seg') { tau = [(q.b[0] - q.a[0]) / q.len, (q.b[1] - q.a[1]) / q.len]; n = [-tau[1], tau[0]]; s = q.s0 + hit.u * q.len; }
    else { n = [-Math.cos(hit.ang), -Math.sin(hit.ang)]; tau = [-Math.sin(hit.ang), Math.cos(hit.ang)]; s = q.s0 + q.r * (hit.ang - q.a0); }
  }
  const dn = d[0] * n[0] + d[1] * n[1], nd = [d[0] - 2 * dn * n[0], d[1] - 2 * dn * n[1]];
  return { x: X, y: Y, d: nd, s: s / T.L, p: nd[0] * tau[0] + nd[1] * tau[1], piece: hit.piece, len: best };
}
/** Run a billiard orbit for n bounces (or until total path length Lmax). */
function runBilliard(T, x, y, d, n, Lmax = Infinity) {
  const hits = []; let last = -1, len = 0, cx = x, cy = y, cd = d;
  for (let i = 0; i < n && len < Lmax; i++) { const h = bounce(T, cx, cy, cd, last); if (!h) break; hits.push({ ...h, fx: cx, fy: cy, fd: cd }); len += h.len; cx = h.x; cy = h.y; cd = h.d; last = h.piece; }
  return hits;
}
function drawTable(s, T, st = {}) { s.path(T.outline, { close: true, color: st.color || 'ink', width: st.width ?? 2.4, fill: st.fill ?? 'muted', fillAlpha: st.fillAlpha ?? 0.04 }); }

// ── 13.13–13.14: Taylor’s driven damped pendulum  φ'' + 2βφ' + ω₀² sin φ = γω₀² cos ωt,  ω = 2π, ω₀ = 1.5ω, β = ω₀/4 ──
const DW = TAU, DW0 = 1.5 * TAU, DB = DW0 / 4, DW02 = DW0 * DW0;
/** Advance (φ, φ') over one drive period (t from 0 to 1) with N RK4 steps, in place; optionally record samples. */
function ddpPeriod(y, g, N = 50, rec = null) {
  const h = 1 / N, A = g * DW02, f = (t, q, p) => -2 * DB * p - DW02 * Math.sin(q) + A * Math.cos(DW * t); let q = y[0], p = y[1];
  for (let i = 0; i < N; i++) {
    const t = i * h, k1q = p, k1p = f(t, q, p), k2q = p + (h / 2) * k1p, k2p = f(t + h / 2, q + (h / 2) * k1q, p + (h / 2) * k1p), k3q = p + (h / 2) * k2p, k3p = f(t + h / 2, q + (h / 2) * k2q, p + (h / 2) * k2p), k4q = p + h * k3p, k4p = f(t + h, q + h * k3q, p + h * k3p);
    q += (h / 6) * (k1q + 2 * k2q + 2 * k3q + k4q); p += (h / 6) * (k1p + 2 * k2p + 2 * k3p + k4p);
    if (rec) rec.push([q, p]);
  }
  y[0] = q; y[1] = p;
}
/** n drive periods of the state and its 2×2 tangent matrix: returns [φ, φ', J11, J12, J21, J22]. */
function ddpMapJ(q, p, g, nper, N = 60) {
  const h = 1 / N, A = g * DW02; let a = 1, B = 0, c = 0, d = 1;
  const f = (t, qq, pp) => -2 * DB * pp - DW02 * Math.sin(qq) + A * Math.cos(DW * t);
  for (let per = 0; per < nper; per++) for (let i = 0; i < N; i++) {
    const t = i * h, c1 = DW02 * Math.cos(q);
    const k1q = p, k1p = f(t, q, p), k1a = c, k1c = -c1 * a - 2 * DB * c, k1B = d, k1d = -c1 * B - 2 * DB * d;
    const q2 = q + (h / 2) * k1q, p2 = p + (h / 2) * k1p, c2 = DW02 * Math.cos(q2), a2 = a + (h / 2) * k1a, cc2 = c + (h / 2) * k1c, B2 = B + (h / 2) * k1B, d2 = d + (h / 2) * k1d;
    const k2q = p2, k2p = f(t + h / 2, q2, p2), k2a = cc2, k2c = -c2 * a2 - 2 * DB * cc2, k2B = d2, k2d = -c2 * B2 - 2 * DB * d2;
    const q3 = q + (h / 2) * k2q, p3 = p + (h / 2) * k2p, c3 = DW02 * Math.cos(q3), a3 = a + (h / 2) * k2a, cc3 = c + (h / 2) * k2c, B3 = B + (h / 2) * k2B, d3 = d + (h / 2) * k2d;
    const k3q = p3, k3p = f(t + h / 2, q3, p3), k3a = cc3, k3c = -c3 * a3 - 2 * DB * cc3, k3B = d3, k3d = -c3 * B3 - 2 * DB * d3;
    const q4 = q + h * k3q, p4 = p + h * k3p, c4 = DW02 * Math.cos(q4), a4 = a + h * k3a, cc4 = c + h * k3c, B4 = B + h * k3B, d4 = d + h * k3d;
    const k4q = p4, k4p = f(t + h, q4, p4), k4a = cc4, k4c = -c4 * a4 - 2 * DB * cc4, k4B = d4, k4d = -c4 * B4 - 2 * DB * d4;
    q += (h / 6) * (k1q + 2 * k2q + 2 * k3q + k4q); p += (h / 6) * (k1p + 2 * k2p + 2 * k3p + k4p);
    a += (h / 6) * (k1a + 2 * k2a + 2 * k3a + k4a); c += (h / 6) * (k1c + 2 * k2c + 2 * k3c + k4c); B += (h / 6) * (k1B + 2 * k2B + 2 * k3B + k4B); d += (h / 6) * (k1d + 2 * k2d + 2 * k3d + k4d);
  }
  return [q, p, a, B, c, d];
}
/** Newton’s method for a period-n orbit of the stroboscopic map (φ is an angle); returns orbit point, trace and det. */
function ddpNewton(q, p, g, n) {
  for (let it = 0; it < 40; it++) {
    const s = ddpMapJ(q, p, g, n); let rq = s[0] - q; const rp = s[1] - p; rq -= TAU * Math.round(rq / TAU);
    const a = s[2] - 1, b = s[3], c = s[4], d = s[5] - 1, det = a * d - b * c, dq = (d * rq - b * rp) / det, dp = (-c * rq + a * rp) / det; q -= dq; p -= dp;
    if (Math.hypot(dq, dp) < 1e-11) { const s2 = ddpMapJ(q, p, g, n); return { q, p, tr: s2[2] + s2[5], det: s2[2] * s2[5] - s2[3] * s2[4], J: s2 }; }
  }
  return null;
}
/** Smallest period (1, 2, 4, …, 32) of a strobe sequence of (φ, φ'), or 0 if none (chaos or not settled). */
function strobePeriod(pts, tol = 2e-4) {
  const n = pts.length;
  for (const P of [1, 2, 4, 8, 16, 32]) { let ok = n > 3 * P; for (let i = n - 1; ok && i >= n - 3 * P; i--) if (Math.abs(wrap(pts[i][0] - pts[i - P][0])) > tol || Math.abs(pts[i][1] - pts[i - P][1]) > 50 * tol) ok = false; if (ok) return P; }
  return 0;
}

// ── 13.16: the Malkus waterwheel = Lorenz system  x' = σ(y − x), y' = ρx − y − xz, z' = xy − bz ─────────────────
function lorenzRun(sig, rho, b, T, h, every, y0 = [1, 1, 1]) {
  const f = (x, y, z) => [sig * (y - x), rho * x - y - x * z, x * y - b * z]; let [x, y, z] = y0; const out = [];
  const n = Math.round(T / h);
  for (let i = 0; i < n; i++) {
    const k1 = f(x, y, z), k2 = f(x + (h / 2) * k1[0], y + (h / 2) * k1[1], z + (h / 2) * k1[2]), k3 = f(x + (h / 2) * k2[0], y + (h / 2) * k2[1], z + (h / 2) * k2[2]), k4 = f(x + h * k3[0], y + h * k3[1], z + h * k3[2]);
    x += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); z += (h / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
    if ((i + 1) % every === 0) out.push([x, y, z]);
  }
  return out;
}

export default {
  collection: 'mech',
  chapter: 13,
  items: [
    // ───────────────────────────────────────────────────────────── 13.9
    {
      num: '13.9',
      kind: 'Phenomenon',
      name: 'Splitting of separatrices: the homoclinic tangle',
      statement: String.raw`For the pendulum (4.15) the outgoing and incoming separatrices of the unstable upright equilibrium coincide: one curve, $H = 1$, is both the unstable manifold $W^u$ and the stable manifold $W^s$ of the saddle. Under a small periodic forcing, $\ddot q = -\sin q + \varepsilon\sin\Omega t$, the saddle becomes a hyperbolic fixed point of the stroboscopic (Poincaré) map, and its manifolds split. Generically they cross transversally at a **homoclinic point**. Its images and preimages are again homoclinic points, so the manifolds cross infinitely often, folding into ever longer and thinner lobes of equal area as they approach the saddle: the **homoclinic tangle**. To first order in $\varepsilon$ the signed distance between the manifolds at the top of the separatrix is given by the **Melnikov function**,
$$d(t_0) \approx \frac{M(t_0)}{|\nabla H|} = \pi\varepsilon\,\operatorname{sech}\!\Big(\frac{\pi\Omega}{2}\Big)\sin\Omega t_0 ,$$
where $t_0$ is the phase of the section. Its simple zeros are transversal crossings, and the factor $\operatorname{sech}(\pi\Omega/2)$ makes the splitting exponentially small for fast forcing. Orbits near the old separatrix wander chaotically in a **stochastic layer** whose width grows with $\varepsilon$.`,
      idea: String.raw`Along the unperturbed separatrix $q_0(t) = 2\arctan(\sinh t)$, $p_0(t) = 2\operatorname{sech}t$, the forcing changes the energy at the rate $\dot H = p\,\varepsilon\sin\Omega t$. A point on $W^u$ has gained $\int_{-\infty}^0$ of this since leaving the saddle; a point on $W^s$ must still lose $\int_0^\infty$ to reach it. Their energy difference is therefore $M(t_0) = \int_{-\infty}^\infty p_0(t)\,\varepsilon\sin\Omega(t + t_0)\,dt = 2\pi\varepsilon\operatorname{sech}(\pi\Omega/2)\sin\Omega t_0$, and dividing by $|\nabla H| = |p_0(0)| = 2$ turns it into a distance. Once the manifolds cross transversally, the map near the tangle contains a Smale horseshoe, the mechanism behind the chaotic layer, and behind the break-up of tori near separatrices in the standard map (13.6).`,
      caption: String.raw`The stroboscopic map of the forced pendulum on its phase cylinder, computed with RK4 over each forcing period. Red: the unstable manifolds of the hyperbolic point (at $q = \pm\pi$, the same point), grown from a tiny segment along its unstable eigenvector, iterated and adaptively refined. Blue: the stable manifolds, grown the same way with the inverse map. The faint dashed curve is the unperturbed separatrix. Right: a close-up of the top, where the two manifolds should meet; the readout compares the measured gap with Melnikov’s formula. Turn the section phase: the gap oscillates as $\sin\Omega t_0$ and vanishes at $0°$ and $180°$, where the manifolds cross on the axis. Raise $\varepsilon$ and the gold chaotic layer around the separatrix widens; raise $\Omega$ and the splitting becomes exponentially small.`,
      deps: ['mech-13.6', 'mech-4.15'],
      refs: ['Arnold App. 7'],
      tags: ['homoclinic tangle', 'Melnikov method', 'separatrix'],
      credit: 'Poincaré, 1890; Melnikov, 1963',
      viz(v) {
        const eS = v.slider('forcing $\\varepsilon$', 0, 0.3, 0.15, { step: 0.005 });
        const wS = v.slider('forcing frequency $\\Omega$', 0.8, 3, 1.3, { step: 0.01 });
        const phS = v.slider('section phase $\\Omega t_0$', 0, TAU, Math.PI / 2, { step: 0.01, fmt: (x) => `${v.fix(x / DEG, 0)}°` });
        const lay = v.toggle('show the chaotic layer', true);
        const sP = v.stage({ x: [-Math.PI, Math.PI], y: [-2.9, 2.9], axes: 'box', gutter: true, height: 390, weight: 1.45, xlabel: 'q', ylabel: 'p', xticks: piTicks(-Math.PI, Math.PI), title: 'stroboscopic map of the forced pendulum' });
        const sZ = v.stage({ x: [-0.8, 0.8], y: [1.6, 2.4], axes: 'box', gutter: true, height: 390, weight: 1, xlabel: 'q', ylabel: 'p', title: 'close-up of the top' });
        const N = 60, cache = memo(), lcache = memo();
        const data = () => cache(`${eS.value}|${wS.value}|${phS.value}`, () => {
          const eps = eS.value, W = wS.value, T = TAU / W, t0 = phS.value / W;
          const P = (q, p) => fpFlow(q, p, t0, T, eps, W, N), Pi = (q, p) => fpFlow(q, p, t0, -T, eps, W, N);
          const H = fpHyperbolic(P, Math.PI - (eps * Math.sin(phS.value)) / (1 + W * W), -(eps * W * Math.cos(phS.value)) / (1 + W * W)), xR = [H.q, H.p], xL = [H.q - TAU, H.p];
          const vu = H.vu[1] > 0 ? H.vu : [-H.vu[0], -H.vu[1]], vs = H.vs[1] > 0 ? H.vs : [-H.vs[0], -H.vs[1]], neg = (z) => [-z[0], -z[1]];
          const inWin = (a, b) => Math.min(a[0], b[0]) < Math.PI + 0.3 && Math.max(a[0], b[0]) > -Math.PI - 0.3 && Math.min(a[1], b[1]) < 3.1 && Math.max(a[1], b[1]) > -3.1;
          const o = { inWin, k: 4 };
          const Wu = [manifold(P, xL, vu, H.lu, o), manifold(P, xR, neg(vu), H.lu, o)];
          const Ws = [manifold(Pi, xR, vs, 1 / H.ls, o), manifold(Pi, xL, neg(vs), 1 / H.ls, o)];
          const pu = firstCross(Wu[0], 0), ps = firstCross(Ws[0], 0);
          const cross = countCrossings(Wu[0], Ws[0], [-Math.PI, Math.PI, 0.05, 3.1]);
          return { eps, W, H, Wu, Ws, pu, ps, cross, P, mel: Math.PI * eps / Math.cosh((Math.PI * W) / 2) * Math.sin(phS.value) };
        });
        const layer = (D) => lcache(`${eS.value}|${wS.value}|${phS.value}`, () => {
          const xs = new Float32Array(1500), ys = new Float32Array(1500); let z = [0, 2.0], hmin = Infinity, hmax = -Infinity;
          for (let i = 0; i < 1500; i++) { z = D.P(z[0], z[1]); xs[i] = wrap(z[0]); ys[i] = z[1]; const h = 0.5 * z[1] * z[1] - Math.cos(z[0]); hmin = Math.min(hmin, h); hmax = Math.max(hmax, h); }
          return { xs, ys, hmin, hmax };
        });
        let cur = null;
        v.render(() => {
          const D = data(), L = lay.value ? layer(D) : null;
          const sepU = (q) => 2 * Math.cos(q / 2);
          for (const s of [sP, sZ]) {
            s.fn(sepU, { color: 'muted', width: 1.2, dash: [5, 4] }); s.fn((q) => -sepU(q), { color: 'muted', width: 1.2, dash: [5, 4] });
            if (L) fastDots(v, s, L.xs, L.ys, L.xs.length, 'gold', { alpha: 0.75, size: s === sZ ? 2.4 : 1.8 });
            for (const k of [-1, 0, 1]) {
              for (const Z of D.Ws) s.path(broken(Z, 0.12, k * TAU), { color: 'blue', width: 1.5 });
              for (const Z of D.Wu) s.path(broken(Z, 0.12, k * TAU), { color: 'red', width: 1.5 });
            }
          }
          sP.dot(D.H.q, D.H.p, { r: 5.5, color: 'ink' }); sP.dot(D.H.q - TAU, D.H.p, { r: 5.5, color: 'ink' });
          const mid = isFinite(D.pu) && isFinite(D.ps) ? (D.pu + D.ps) / 2 : 2, half = Math.max(0.12, 1.6 * Math.abs(D.pu - D.ps), 0.6 * D.eps + 0.05);
          sZ.setView([-1.6 * half, 1.6 * half], [mid - half, mid + half]);
          sZ.vline(0, { color: 'faint', width: 1 });
          if (isFinite(D.pu)) sZ.dot(0, D.pu, { r: 5, color: 'red' });
          if (isFinite(D.ps)) sZ.dot(0, D.ps, { r: 5, color: 'blue' });
          if (isFinite(D.pu) && isFinite(D.ps) && Math.abs(D.pu - D.ps) > half * 0.06) sZ.measure(0.25 * half, D.ps, 0.25 * half, D.pu, 'd');
          sP.rect(-1.6 * half, mid - half, 1.6 * half, mid + half, { color: 'ink', width: 1, fill: false, dash: [3, 3] });
          cur = { D, L };
        });
        v.legend([['red', 'unstable manifold $W^u$'], ['blue', 'stable manifold $W^s$'], ['gold', 'one orbit in the chaotic layer'], ['muted', 'unperturbed separatrix', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { D, L } = cur, gap = D.pu - D.ps;
          if (D.eps === 0) return String.raw`$\varepsilon = 0$: $W^u$ and $W^s$ coincide with the separatrix (measured gap at $q = 0$: $${sci(v, Math.abs(gap))}$) — no tangle, no chaos`;
          return String.raw`gap between $W^u$ and $W^s$ at $q = 0$: measured ${v.fix(gap, 4)}, Melnikov $\pi\varepsilon\,\mathrm{sech}(\pi\Omega/2)\sin\Omega t_0 = ${v.fix(D.mel, 4)}$ · crossings of the upper branches found in view: ${D.cross} · unstable multiplier of the map $\lambda_u = ${v.fix(D.H.lu, 1)}$` + (L ? String.raw` · the gold orbit spans $H \in [${v.fix(L.hmin, 3)}, ${v.fix(L.hmax, 3)}]$` : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 13.10
    {
      num: '13.10',
      kind: 'Model',
      name: 'Billiards: integrable, mixed and chaotic',
      statement: String.raw`A **billiard** is a point particle moving freely inside a planar region and reflecting specularly off its boundary (angle of incidence equals angle of reflection). Record each bounce by the arclength $s$ of the impact point along the wall and $p = \sin\alpha$, where $\alpha$ is the angle between the outgoing direction and the inward normal. The bounce map $(s, p) \mapsto (s', p')$ preserves the area $ds\,dp$ (it is the Poincaré map, 13.2, of the flow), and the shape of the table decides the dynamics:
(a) **Circle**: the angle is the same at every bounce (angular momentum is conserved); the portrait consists of horizontal lines, and every chord stays tangent to a concentric circle, the caustic. Integrable.
(b) **Ellipse**: the product of the angular momenta about the two foci is conserved, and every orbit is tangent to a confocal ellipse or hyperbola. Integrable.
(c) **Stadium** (two semicircles joined by straight segments): Bunimovich proved it ergodic and chaotic, with a positive Lyapunov exponent; a typical orbit fills its whole section.
(d) **Mushroom** (a semicircular cap on a stem): orbits that stay in the cap with large enough angular momentum are regular; the rest are chaotic. Phase space is cleanly divided.`,
      scope: String.raw`Ideal specular reflection off a rigid, smooth wall; corners are measure-zero exceptions.`,
      idea: String.raw`Between bounces the motion is free, so all the dynamics is in the reflections, and the bounce map is a canonical transformation (12.10) of the boundary’s phase space. Symmetry gives the circle its integral, and a less obvious one, Joachimsthal’s, gives the ellipse a second integral. Flat walls and focusing arcs placed so that beams defocus between bounces make nearby orbits separate exponentially (Bunimovich’s mechanism), destroying every invariant curve. A mushroom’s cap keeps the circle’s integral for orbits that never reach the stem, which gives a regular region bounded by a sharp edge, with no KAM hierarchy of islands.`,
      caption: String.raw`Left: the table. Drag the gold ball and the black aim handle to choose where it starts and the direction it goes. Its first bounces are drawn. Right: the Birkhoff portrait, position on the wall against $p = \sin\alpha$, with 2 500 bounces of your orbit in gold over faint orbits from random starts. Switch tables: the circle gives horizontal lines (the readout checks that $p$ never changes), the ellipse gives curves (it checks Joachimsthal’s integral), the stadium sprays one orbit over the whole portrait, and the mushroom shows a regular band (orbits trapped in the cap) next to a chaotic sea.`,
      deps: ['mech-13.2', 'mech-12.10'],
      refs: ['Arnold App. 1'],
      tags: ['billiards', 'ergodicity', 'chaos'],
      credit: 'Birkhoff, 1927; Sinai, 1970; Bunimovich, 1979; mushrooms: Bunimovich, 2001',
      viz(v) {
        const tS = v.select('table', ['circle', 'ellipse', 'stadium', 'mushroom'], 'stadium');
        const sT = v.stage({ x: [-1.75, 1.75], y: [-0.95, 1.38], equal: true, axes: false, height: 340, weight: 1, title: 'the table (drag the ball and the aim)' });
        const sB = v.stage({ x: [0, 1], y: [-1, 1], axes: 'box', gutter: true, height: 340, weight: 1.1, xlabel: 'position on the wall s / L', ylabel: 'p = sin α', title: 'Birkhoff phase portrait' });
        const tables = {}; const T = () => (tables[tS.value] ||= makeTable(tS.value));
        let ok = [0.22, 0.48];
        const hb = sT.handle(0.22, 0.48, { color: 'gold', r: 7, constrain: (x, y) => { if (T().inside(x, y)) ok = [x, y]; return ok; } });
        const ha = sT.handle(0.9, 0.85, { color: 'ink', r: 6 });
        const bgCache = memo(), orbCache = memo();
        const background = () => bgCache(tS.value, () => {
          const Tb = T(), r = v.rng(17), out = [];
          for (let k = 0; k < 26; k++) {
            let x, y, g = 0; do { x = Tb.bbox[0] + (Tb.bbox[1] - Tb.bbox[0]) * r(); y = Tb.bbox[2] + (Tb.bbox[3] - Tb.bbox[2]) * r(); } while (!Tb.inside(x, y) && g++ < 200);
            const a = TAU * r(), H = runBilliard(Tb, x, y, [Math.cos(a), Math.sin(a)], 320); out.push({ s: H.map((h) => h.s), p: H.map((h) => h.p) });
          }
          return out;
        });
        const orbit = () => orbCache(`${tS.value}|${hb.x}|${hb.y}|${ha.x}|${ha.y}`, () => {
          const Tb = T(); if (!Tb.inside(hb.x, hb.y)) hb.set(0.22, 0.48);
          let dx = ha.x - hb.x, dy = ha.y - hb.y; const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n;
          const H = runBilliard(Tb, hb.x, hb.y, [dx, dy], 2500);
          const s = H.map((h) => h.s), p = H.map((h) => h.p), cells = new Set(); H.forEach((h) => cells.add(Math.min(39, Math.floor(h.s * 40)) * 20 + Math.min(19, Math.floor((h.p + 1) * 10))));
          return { H, s, p, cover: cells.size / 800, d: [dx, dy] };
        });
        let cur = null;
        v.render(() => {
          const Tb = T(), O = orbit(), B = background();
          drawTable(sT, Tb);
          const segs = Math.min(40, O.H.length);
          for (let i = 0; i < segs; i++) { const h = O.H[i]; sT.line(h.fx, h.fy, h.x, h.y, { color: 'accent', width: 1.6, alpha: 0.9 - (0.75 * i) / segs }); }
          sT.arrow(hb.x, hb.y, hb.x + 0.35 * O.d[0], hb.y + 0.35 * O.d[1], { color: 'gold', width: 2.2 });
          for (const b of B) fastDots(v, sB, b.s, b.p, b.s.length, 'muted', { alpha: 0.5, size: 1.5 });
          fastDots(v, sB, O.s, O.p, O.s.length, 'gold', { alpha: 0.9, size: 2 });
          cur = { Tb, O };
        });
        v.legend([['accent', 'first 40 flights'], ['gold', 'your orbit: 2 500 bounces'], ['muted', 'orbits from random starts']]);
        v.readout(() => {
          if (!cur) return '';
          const { Tb, O } = cur, cov = `it visits ${v.fix(100 * O.cover, 0)}% of the cells of a 40 × 20 grid on the portrait`;
          if (Tb.name === 'circle') return String.raw`circle: $p = \sin\alpha = ${v.fix(O.p[0], 6)}$ at every bounce (spread over 2 500 bounces: $${sci(v, Math.max(...O.p) - Math.min(...O.p))}$) — angular momentum is conserved, the caustic has radius $|p| = ${v.fix(Math.abs(O.p[0]), 3)}$ · ${cov}`;
          if (Tb.name === 'ellipse') { const c = Math.sqrt(Tb.ell.a ** 2 - Tb.ell.b ** 2), Ls = O.H.map((h) => ((h.x - c) * h.d[1] - h.y * h.d[0]) * ((h.x + c) * h.d[1] - h.y * h.d[0])), sp = Math.max(...Ls) - Math.min(...Ls); return String.raw`ellipse: Joachimsthal’s integral $L_1L_2$ (product of angular momenta about the foci) $= ${v.fix(Ls[0], 5)}$, spread $${sci(v, sp)}$ → orbit tangent to a confocal ${Ls[0] > 0 ? '**ellipse** (it circulates)' : '**hyperbola** (it bounces between the ends)'} · ${cov}`; }
          if (Tb.name === 'stadium') return String.raw`stadium: no conserved quantity — $p$ ranges over $[${v.fix(Math.min(...O.p), 2)}, ${v.fix(Math.max(...O.p), 2)}]$ · ${cov}: a single orbit spreads over the whole section`;
          const H = O.H; let stem = false, lo = Infinity, hi = -Infinity; for (const h of H) { if (h.y < 0.3 - 1e-9) stem = true; const L = Math.abs(h.x * h.d[1] - (h.y - 0.3) * h.d[0]); lo = Math.min(lo, L); hi = Math.max(hi, L); }
          return stem ? String.raw`mushroom: the orbit enters the stem, its angular momentum about the cap’s centre wanders over $[${v.fix(lo, 2)}, ${v.fix(hi, 2)}]$ — **chaotic** · ${cov}` : String.raw`mushroom: the orbit never leaves the cap, angular momentum $|L| = ${v.fix(hi, 4)}$ (spread $${sci(v, hi - lo)}$) exceeds the stem’s half-width ${Tb.W} — **regular** · ${cov}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 13.11
    {
      num: '13.11',
      kind: 'Concept',
      name: 'Ergodicity and time averages',
      statement: String.raw`A measure-preserving flow (or map) on a space $X$ with invariant probability measure $\mu$ is **ergodic** if every invariant set has measure $0$ or $1$; equivalently, the space cannot be split into two invariant parts of positive measure. Birkhoff’s ergodic theorem says that for every integrable observable $f$ the time average
$$\bar f(x) = \lim_{T\to\infty}\frac1T\int_0^T f(\varphi_t x)\,dt$$
exists for almost every $x$, and it equals the space average $\int_X f\,d\mu$ for almost every $x$ precisely when the flow is ergodic (the $L^2$ version is von Neumann’s mean ergodic theorem, fa-12.44). For a billiard the invariant measure is uniform in position and direction, so in an ergodic table a single typical orbit spends in each region a fraction of time equal to that region’s share of the area. Integrable systems are never ergodic on an energy surface, since each invariant torus is an invariant set, and mixed systems split into ergodic components.`,
      idea: String.raw`If the flow is ergodic, $\bar f$ is an invariant function, so each of its level sets is invariant and has measure $0$ or $1$; hence $\bar f$ is almost everywhere constant, and integrating shows that the constant is $\int f\,d\mu$. Conversely, an invariant set $A$ of intermediate measure gives an observable, its indicator, whose time average is 1 on $A$ and 0 off it, unlike its space average $\mu(A)$. In a circular billiard the angle of incidence is conserved (13.10), so an orbit never enters the disc inside its caustic: the annuli between caustics are invariant sets of intermediate measure. In the stadium no such sets exist. Poincaré recurrence (13.1) is the weaker statement that holds without ergodicity.`,
      caption: String.raw`One long billiard orbit. Left: the time it has spent at each place, shaded relative to the uniform density (dark: more time than average, pale: less). Drag the gold ball and the aim to choose the orbit, and drag the green disc, a test region. Right: on log–log axes, the error between the fraction of time spent in the disc and the disc’s share of the table’s area. In the stadium the error falls like $T^{-1/2}$ (dashed), and the picture becomes uniform. In the circle it levels off: the orbit never enters the disc inside its caustic, so a test region there gets no time at all. In the mushroom it levels off too, because the orbit explores only its own ergodic component.`,
      deps: ['mech-13.1', 'fa-12.44', 'mech-13.10'],
      refs: ['Arnold §51'],
      tags: ['ergodicity', 'time average', 'billiards'],
      credit: 'Boltzmann, 1871; Birkhoff, 1931; von Neumann, 1932',
      viz(v) {
        const tS = v.select('table', ['circle', 'stadium', 'mushroom'], 'stadium');
        const TS = v.slider('total time $T$ (path length)', 20, 40000, 8000, { log: true, sig: 2 });
        const R = 0.22, NX = 72;
        const sT = v.stage({ x: [-1.75, 1.75], y: [-0.95, 1.38], equal: true, axes: false, height: 340, weight: 1, title: 'time spent at each place' });
        const sE = v.stage({ x: [1, 40000], y: [1e-4, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'time T', ylabel: '|time average − space average|' });
        const tables = {}; const T = () => (tables[tS.value] ||= makeTable(tS.value));
        let ok = [0.22, 0.48], okR = [-0.25, 0.75];
        const hb = sT.handle(0.22, 0.48, { color: 'gold', r: 7, constrain: (x, y) => { if (T().inside(x, y)) ok = [x, y]; return ok; } });
        const ha = sT.handle(0.9, 0.85, { color: 'ink', r: 6 });
        const discInside = (x, y) => { const Tb = T(); for (let k = 0; k < 24; k++) if (!Tb.inside(x + R * Math.cos((TAU * k) / 24), y + R * Math.sin((TAU * k) / 24))) return false; return true; };
        const hr = sT.handle(-0.25, 0.75, { color: 'green', r: 6, constrain: (x, y) => { if (discInside(x, y)) okR = [x, y]; return okR; } });
        const chord = (x0, y0, x1, y1, cx, cy) => { // length of the segment inside the disc
          const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, ox = x0 - cx, oy = y0 - cy, b = ox * ux + oy * uy, c = ox * ox + oy * oy - R * R, D = b * b - c;
          if (D <= 0) return 0; const t0 = Math.max(0, -b - Math.sqrt(D)), t1 = Math.min(L, -b + Math.sqrt(D)); return Math.max(0, t1 - t0);
        };
        const cache = memo();
        const data = () => cache(`${tS.value}|${hb.x}|${hb.y}|${ha.x}|${ha.y}|${hr.x}|${hr.y}|${TS.value}`, () => {
          const Tb = T();
          if (!Tb.inside(hb.x, hb.y)) { hb.set(0.22, 0.48); ok = [0.22, 0.48]; }
          if (!discInside(hr.x, hr.y)) { hr.set(-0.25, 0.75); okR = [-0.25, 0.75]; }
          let dx = ha.x - hb.x, dy = ha.y - hb.y; const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n;
          const Tmax = TS.value, H = runBilliard(Tb, hb.x, hb.y, [dx, dy], 1e6, Tmax);
          const [x0, x1, y0, y1] = Tb.bbox, ny = Math.round((NX * (y1 - y0)) / (x1 - x0)), cw = (x1 - x0) / NX, chh = (y1 - y0) / ny, bins = new Float64Array(NX * ny);
          const ts = [], errs = [], spaceAvg = (Math.PI * R * R) / Tb.area; let tl = 0, inDisc = 0, nextT = 1;
          for (const h of H) {
            const L = Math.min(h.len, Tmax - tl), ex = h.fx + L * h.fd[0], ey = h.fy + L * h.fd[1], m = Math.max(1, Math.ceil(L / 0.012));
            for (let k = 0; k < m; k++) { const f = (k + 0.5) / m, X = h.fx + f * (ex - h.fx), Y = h.fy + f * (ey - h.fy); const i = Math.floor((X - x0) / cw), j = Math.floor((Y - y0) / chh); if (i >= 0 && j >= 0 && i < NX && j < ny) bins[j * NX + i] += L / m; }
            inDisc += chord(h.fx, h.fy, ex, ey, hr.x, hr.y); tl += L;
            while (nextT <= tl) { ts.push(nextT); errs.push(Math.abs(inDisc / tl - spaceAvg)); nextT *= 1.15; }
            if (tl >= Tmax) break;
          }
          let cells = 0; for (let j = 0; j < ny; j++) for (let i = 0; i < NX; i++) if (Tb.inside(x0 + (i + 0.5) * cw, y0 + (j + 0.5) * chh)) cells++;
          const mean = tl / cells; let c0 = 0; for (let j = 0; j < ny; j++) for (let i = 0; i < NX; i++) if (Tb.inside(x0 + (i + 0.5) * cw, y0 + (j + 0.5) * chh) && bins[j * NX + i] < 0.05 * mean) c0++;
          return { Tb, bins, ny, cw, chh, mean, ts, errs, timeAvg: inDisc / tl, spaceAvg, tl, nb: H.length, empty: c0 / cells };
        });
        let cur = null;
        v.render(() => {
          const D = data(), Tb = D.Tb, [x0, , y0] = Tb.bbox;
          sT.raster((x, y) => { if (!Tb.inside(x, y)) return null; const i = Math.floor((x - x0) / D.cw), j = Math.floor((y - y0) / D.chh); if (i < 0 || j < 0 || i >= NX || j >= D.ny) return null; return v.ramp(clamp((0.55 * D.bins[j * NX + i]) / D.mean, 0, 1), 'accent'); }, { key: `${tS.value}|${hb.x}|${hb.y}|${ha.x}|${ha.y}|${TS.value}|${v.color('panel')}`, res: 2 });
          drawTable(sT, Tb, { fill: false });
          sT.circle(hr.x, hr.y, R, { color: 'green', width: 2.2, fill: 'green', fillAlpha: 0.12 });
          sT.arrow(hb.x, hb.y, hb.x + 0.35 * (ha.x - hb.x) / Math.hypot(ha.x - hb.x, ha.y - hb.y), hb.y + 0.35 * (ha.y - hb.y) / Math.hypot(ha.x - hb.x, ha.y - hb.y), { color: 'gold', width: 2.2 });
          const e0 = D.errs.find((e, k) => D.ts[k] >= 30) || 0.3;
          sE.fn((t) => e0 * Math.sqrt(30 / t), { color: 'muted', dash: [6, 4], width: 1.4 });
          sE.path(D.ts.map((t, k) => [t, Math.max(1.2e-4, D.errs[k])]), { color: 'green', width: 2 });
          sE.vline(TS.value, { color: 'gold', width: 1.2 });
          cur = D;
        });
        v.legend([['accent', 'time density (relative to uniform)', { area: true }], ['green', 'test disc / error of its time average'], ['muted', '$\\propto T^{-1/2}$', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const D = cur;
          return String.raw`after $T = ${v.fix(D.tl, 0)}$ (${D.nb.toLocaleString('en')} bounces): fraction of time in the green disc ${v.fix(D.timeAvg, 4)}, its share of the area ${v.fix(D.spaceAvg, 4)} · parts of the table the orbit has (almost) never visited: ${v.fix(100 * D.empty, 0)}% → ` + (D.empty > 0.05 ? '**not ergodic on the whole table**: the orbit is confined to an invariant region' : Math.abs(D.timeAvg - D.spaceAvg) < 0.15 * D.spaceAvg ? '**time average ≈ space average**, as ergodicity requires' : 'not converged yet: increase $T$');
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 13.12
    {
      num: '13.12',
      kind: 'Definition',
      name: 'Dissipation and attractors',
      statement: String.raw`A flow $\dot x = f(x)$ is **dissipative** if it contracts phase-space volume on average. By Liouville’s formula (12.13) a region $D$ evolves as
$$\frac{d}{dt}\ln\operatorname{vol}(\varphi_tD) = \big\langle \nabla\!\cdot f\big\rangle_{\varphi_tD},$$
the mean divergence over the current region, so friction ($\nabla\!\cdot f = -\gamma$ for linear damping) makes volumes shrink like $e^{-\gamma t}$. An **attractor** is a closed invariant set $A$ that attracts an open neighbourhood (its **basin**) and is minimal with this property. In the plane, the possible attractors of a flow are stable fixed points and stable limit cycles (4.19). In three or more dimensions, including a forced oscillator with time as the third coordinate, the attractor can be **strange**: a fractal set of zero volume, on which the motion is chaotic, with nearby orbits separating exponentially (13.4) while the volume of every blob still shrinks to zero.`,
      idea: String.raw`Contraction of volume does not mean contraction in every direction. A blob can be stretched along one direction and squeezed even harder along another, so its volume tends to zero while its length grows. Folding keeps the stretched blob in a bounded region, and repeated stretching and folding turns it into a set with a layered, Cantor-like cross-section: the strange attractor. In the plane there is no room to fold without crossing, so (Poincaré–Bendixson) only fixed points and cycles remain. Hamiltonian systems have zero divergence and can have no attractors at all, which is why recurrence (13.1) holds for them and not for dissipative systems.`,
      caption: String.raw`A disc of 1 500 initial states (gold) and its boundary (blue, a loop of states refined adaptively as in 12.13) move under the flow. Drag the handle to move the disc. Right: the disc’s area, measured from the polygon (log scale), against the prediction from Liouville’s formula (dashed). For the damped pendulum the cloud winds into the stable equilibrium and its area falls like $e^{-\gamma t}$. For the van der Pol oscillator the divergence $\mu(1 - x^2)$ changes sign, so the area grows near the origin and shrinks outside, and the cloud is wrapped onto the limit cycle. For the forced Duffing oscillator ($\ddot x + 0.25\dot x - x + x^3 = 0.3\cos t$) the area shrinks like $e^{-0.25t}$ while the cloud is stretched and folded onto the strange attractor; the green dots show that attractor at the current phase of the forcing.`,
      deps: ['mech-12.13', 'mech-4.19'],
      refs: ['Goldstein §11.3'],
      tags: ['attractor', 'dissipation', 'strange attractor'],
      viz(v) {
        const sys = v.select('system', [{ value: 'pend', label: 'damped pendulum' }, { value: 'vdp', label: 'van der Pol ($\\mu = 1$)' }, { value: 'duff', label: 'forced Duffing' }], 'pend', { onChange: () => { const c = CENT[sys.value]; hc.set(c[0], c[1]); } });
        const gS = v.slider('damping $\\gamma$', 0.05, 0.6, 0.25, { step: 0.01 });
        const TT = 32, DT = 0.02, NP = 1500, RAD = 0.38, MU = 1, DD = 0.25, DG = 0.3;
        const CENT = { pend: [-2.2, 1.7], vdp: [0.75, 0.45], duff: [0.95, 0.35] }, VIEW = { pend: [[-Math.PI, Math.PI], [-2.7, 2.7]], vdp: [[-3.2, 3.2], [-3.6, 3.6]], duff: [[-1.9, 1.9], [-1.25, 1.25]] };
        const sP = v.stage({ x: [-Math.PI, Math.PI], y: [-2.7, 2.7], axes: 'box', gutter: true, height: 380, weight: 1.4, xlabel: 'x', ylabel: 'ẋ' });
        const sA = v.stage({ x: [0, TT], y: [1e-3, 3], ylog: true, axes: 'box', gutter: true, height: 380, weight: 1, xlabel: 't', title: 'area of the cloud ÷ initial' });
        const hc = sP.handle(-2.2, 1.7, { color: 'ink', r: 7 });
        hc.onDrag = () => v.restart();
        const F = (name, g) => name === 'pend' ? (t, x, y) => [y, -Math.sin(x) - g * y] : name === 'vdp' ? (t, x, y) => [y, MU * (1 - x * x) * y - x] : (t, x, y) => [y, -DD * y + x - x * x * x + DG * Math.cos(t)];
        const rk = (f, z, h) => { // z = [x, y, t]
          const [x, y, t] = z, k1 = f(t, x, y), k2 = f(t + h / 2, x + (h / 2) * k1[0], y + (h / 2) * k1[1]), k3 = f(t + h / 2, x + (h / 2) * k2[0], y + (h / 2) * k2[1]), k4 = f(t + h, x + h * k3[0], y + h * k3[1]);
          z[0] = x + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); z[1] = y + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); z[2] = t + h;
        };
        const meanDiv = (name, g, Y) => {
          if (name === 'pend') return -g; if (name === 'duff') return -DD;
          let A = 0, Ixx = 0; const n = Y.length; for (let i = 0, j = n - 1; i < n; j = i++) { const cr = Y[j][0] * Y[i][1] - Y[i][0] * Y[j][1]; A += cr / 2; Ixx += (cr * (Y[j][0] ** 2 + Y[j][0] * Y[i][0] + Y[i][0] ** 2)) / 12; }
          return MU * (1 - Ixx / A);
        };
        const attCache = memo();
        const attractor = () => attCache(sys.value, () => {
          if (sys.value === 'pend') return null;
          const f = F(sys.value, 0), z = [0.5, 0, 0];
          if (sys.value === 'vdp') { for (let i = 0; i < 3000; i++) rk(f, z, DT); const pts = []; for (let i = 0; i < 360; i++) { rk(f, z, DT); pts.push([z[0], z[1]]); } return { cycle: pts }; }
          const per = 64, h = TAU / per, n = 2000, xs = new Float32Array(n * per), ys = new Float32Array(n * per);
          for (let i = 0; i < 100 * per; i++) rk(f, z, h);
          for (let i = 0; i < n * per; i++) { rk(f, z, h); xs[i] = z[0]; ys[i] = z[1]; }
          return { per, n, xs, ys };
        });
        const sim = v.sim(() => {
          const name = sys.value, g = gS.value, f = F(name, g), cx = hc.x, cy = hc.y, r = v.rng(23), xs = new Float64Array(NP), ys = new Float64Array(NP);
          for (let k = 0; k < NP; k++) { const a = TAU * r(), rr = RAD * Math.sqrt(r()); xs[k] = cx + rr * Math.cos(a); ys[k] = cy + rr * Math.sin(a); }
          const step = name === 'pend' ? (y, h) => { pendStep(y, h, g); y[2] += h; } : (y, h) => rk(f, y, h);
          const L = makeLoop({ init: (s) => [cx + RAD * Math.cos(TAU * s), cy + RAD * Math.sin(TAU * s), 0], step, h: DT, n0: 160, tol: 0.05, maxPts: 9000 });
          const A0 = shoelace(L.Y);
          return { name, g, f, xs, ys, L, A0, lnPred: 0, hist: [[0, 1, 1]], n: 0, step };
        }, (st, dt) => {
          const z = [0, 0, st.n * dt];
          for (let k = 0; k < NP; k++) { z[0] = st.xs[k]; z[1] = st.ys[k]; z[2] = st.n * dt; st.step(z, dt); st.xs[k] = z[0]; st.ys[k] = z[1]; }
          const md = meanDiv(st.name, st.g, st.L.Y); st.L.advance(); st.n++; st.lnPred += dt * md;
          if (st.n % 5 === 0 && !st.L.capped) { st.L.refine(1500); if (!st.L.capped) st.hist.push([st.n * dt, shoelace(st.L.Y) / st.A0, Math.exp(st.lnPred)]); }
        }, { dt: DT });
        let cur = null, lastKey = '';
        v.animate((tt) => {
          const key = `${sys.value}|${gS.value}`; if (key !== lastKey) { lastKey = key; sim.reset(); }
          gS.el.hidden = sys.value !== 'pend';
          const st = sim.advance(Math.min(2 * tt, TT)), t = st.n * DT, name = st.name, [vx, vy] = VIEW[name];
          sP.setView(vx, vy); sP.setTicks(name === 'pend' ? piTicks(-Math.PI, Math.PI) : null, null);
          sA.setView([0, TT], name === 'vdp' ? [1e-4, 30] : [1e-3, 3]);
          const att = attractor();
          if (name === 'pend') { sP.contour((x, y) => 0.5 * y * y - Math.cos(x), [1], { color: 'muted', width: 1, alpha: 0.6, res: 120 }); sP.dot(0, 0, { r: 6, color: 'green' }); }
          if (att && att.cycle) sP.path(att.cycle, { color: 'green', width: 2.6, close: true });
          if (att && att.xs) { const j = Math.round(((t % TAU) / TAU) * att.per) % att.per, xs = new Float32Array(att.n), ys = new Float32Array(att.n); for (let i = 0; i < att.n; i++) { xs[i] = att.xs[i * att.per + j]; ys[i] = att.ys[i * att.per + j]; } fastDots(v, sP, xs, ys, att.n, 'green', { alpha: 0.7, size: 1.8 }); }
          const W = name === 'pend' ? (x) => wrap(x) : (x) => x, px = new Float64Array(NP); for (let k = 0; k < NP; k++) px[k] = W(st.xs[k]);
          fastDots(v, sP, px, st.ys, NP, 'gold', { alpha: 0.8, size: 2 });
          if (!st.L.capped) { if (name === 'pend') drawCyl(sP, st.L.Y, { fill: false, color: 'accent', width: 1.4 }); else sP.poly(st.L.Y, { fill: false, color: 'accent', width: 1.4 }); }
          sP.corner(`t = ${v.fix(t, 1)}`, 'tr', { color: 'ink', plate: true });
          sA.path(st.hist.map((h) => [h[0], h[1]]), { color: 'accent', width: 3.2, alpha: 0.75 });
          sA.path(st.hist.map((h) => [h[0], h[2]]), { color: 'red', width: 1.6, dash: [6, 4] });
          sA.hline(1, { color: 'faint', width: 1 }); sA.vline(t, { color: 'gold', width: 1.2 });
          cur = { st, t };
        }, { period: TT / 2 + 2, still: 9 });
        v.legend([['gold', 'cloud of states'], ['accent', 'its boundary / measured area'], ['red', 'Liouville: $d\\ln A/dt = \\langle\\nabla\\cdot f\\rangle$', { dash: true }], ['green', 'attractor']]);
        v.readout(() => {
          if (!cur) return '';
          const { st } = cur, h = st.hist[st.hist.length - 1];
          const kind = st.name === 'pend' ? 'a stable fixed point' : st.name === 'vdp' ? 'a limit cycle' : 'a strange attractor';
          return String.raw`area ÷ initial at $t = ${v.fix(h[0], 1)}$: measured ${num(v, h[1], 4)}, Liouville’s formula ${num(v, h[2], 4)}` + (st.name !== 'vdp' ? String.raw` $= e^{-${st.name === 'pend' ? v.fix(st.g, 2) : DD}t}$` : String.raw` (from the mean of $\mu(1 - x^2)$ over the cloud)`) + (st.L.capped ? ' · the boundary has been stretched beyond what can be tracked (strange attractor: length grows exponentially while area shrinks)' : ` · boundary states: ${st.L.S.length}`) + ` · attractor: ${kind}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 13.13
    {
      num: '13.13',
      kind: 'Model',
      name: 'Driven damped pendulum: the route to chaos',
      statement: String.raw`A pendulum with linear damping and a sinusoidal driving torque obeys
$$\ddot\phi + 2\beta\dot\phi + \omega_0^2\sin\phi = \gamma\,\omega_0^2\cos\omega t ,$$
where the dimensionless **drive strength** $\gamma$ is the ratio of the drive torque to the maximum gravitational torque. With Taylor’s parameters $\omega = 2\pi$ (drive period 1), $\omega_0 = 1.5\omega$, $\beta = \omega_0/4$, and starting from rest at $\phi = -\pi/2$: for small $\gamma$ the motion settles into a periodic response with the drive’s period, nearly sinusoidal; around $\gamma \approx 1$ it is periodic but strongly anharmonic; near $\gamma \approx 1.066$ it **doubles its period** (alternate swings differ), at $\gamma \approx 1.079$ doubles again, then again ever faster, and beyond about $\gamma \approx 1.083$ it is **chaotic**, never repeating, with a positive Lyapunov exponent. At larger $\gamma$ periodic windows and rolling motions, where the pendulum goes over the top, alternate with chaos.`,
      scope: String.raw`The thresholds quoted depend on the damping, frequencies and initial state; the qualitative route (period doubling to chaos) is generic for driven dissipative oscillators.`,
      idea: String.raw`Sampling the state once per drive cycle gives a two-dimensional map that contracts area by $e^{-2\beta}$ per cycle (13.12). A periodic response is a fixed point of this map, stable while its two Floquet multipliers lie inside the unit circle. As $\gamma$ grows, one multiplier passes through $-1$: the fixed point becomes unstable, and a stable cycle of period two is born (a flip bifurcation). The same happens to that cycle and its descendants, at drive strengths that accumulate geometrically (13.14). Past the accumulation point the attractor is strange: the stroboscopic points no longer repeat but lie on a fractal set, and nearby states separate exponentially (13.4).`,
      caption: String.raw`Top left: the stroboscopic section, the state $(\phi, \dot\phi)$ once per drive cycle, after the transient has died away (red dots), over the continuous trajectory (faint). Top right: the pendulum itself. Bottom: $\phi(t)$ over eight drive cycles; the grey bars mark the drive cycles. Use the presets or the slider. At $1.060$ one red dot: the motion repeats every cycle. At $1.078$ two dots, and alternate swings differ. At $1.081$ four, at $1.0826$ eight. At $1.105$ the dots never repeat: they trace out a strange attractor (thin, because each drive cycle contracts areas by $e^{-2\beta}$), the time series wanders, and the Lyapunov exponent in the readout turns positive.`,
      deps: ['mech-13.12', 'mech-4.14'],
      refs: ['Taylor §12.2', 'Taylor §12.4'],
      tags: ['driven pendulum', 'period doubling', 'chaos'],
      viz(v) {
        const gS = v.slider('drive strength $\\gamma$', 0.9, 1.11, 1.078, { step: 0.0001, decimals: 4 });
        const pre = v.select('preset', ['1.060', '1.078', '1.081', '1.0826', '1.105'].map((x) => ({ value: x, label: x })), '1.078', { onChange: () => gS.set(+pre.value) });
        const NC = 8;
        const sS = v.stage({ x: [-Math.PI, Math.PI], y: [-20, 20], axes: 'box', gutter: true, height: 330, weight: 1.45, xlabel: 'φ (rad)', ylabel: 'dφ/dt', xticks: piTicks(-Math.PI, Math.PI), title: 'stroboscopic section (once per drive cycle)' });
        const sR = v.stage({ x: [-1.35, 1.35], y: [-1.35, 1.35], equal: true, axes: false, height: 330, weight: 1, title: 'the pendulum' });
        const sT = v.stage({ x: [0, NC], y: [-3.5, 1], axes: 'box', gutter: true, height: 180, full: true, xlabel: 't (drive cycles)', ylabel: 'φ (rad)' });
        const cache = memo();
        const data = () => cache(gS.value, () => {
          const g = gS.value, y = [-Math.PI / 2, 0];
          for (let k = 0; k < 300; k++) ddpPeriod(y, g, 50);
          const rec = [[y[0], y[1]]]; const y2 = y.slice(); for (let k = 0; k < NC; k++) ddpPeriod(y2, g, 60, rec);
          const strobe = []; const y3 = y.slice(); for (let k = 0; k < 600; k++) { ddpPeriod(y3, g, 50); strobe.push([y3[0], y3[1]]); }
          const P = strobePeriod(strobe);
          // largest Lyapunov exponent of the stroboscopic map (tangent vector renormalised every cycle)
          let q = y[0], p = y[1], u = [1, 0], S = 0;
          for (let k = 0; k < 160; k++) { const s = ddpMapJ(q, p, g, 1, 50); q = s[0]; p = s[1]; const nu = [s[2] * u[0] + s[3] * u[1], s[4] * u[0] + s[5] * u[1]], r = Math.hypot(nu[0], nu[1]); S += Math.log(r); u = [nu[0] / r, nu[1] / r]; }
          let lo = Infinity, hi = -Infinity, plo = Infinity, phi = -Infinity; for (const z of rec) { lo = Math.min(lo, z[0]); hi = Math.max(hi, z[0]); plo = Math.min(plo, z[1]); phi = Math.max(phi, z[1]); }
          const rolls = Math.abs(strobe[strobe.length - 1][0] - strobe[0][0]) > 4 * Math.PI;
          return { g, rec, strobe, P, lam: S / 160, lo, hi, plo, phi, rolls };
        });
        let cur = null;
        v.animate((tt) => {
          const D = data(), tau = (0.55 * tt) % NC, i = Math.min(D.rec.length - 1, Math.round(tau * 60)), q = D.rec[i][0];
          // section
          const pm = Math.max(Math.abs(D.plo), Math.abs(D.phi)) * 1.1; sS.setView([-Math.PI, Math.PI], [-pm, pm]);
          const tr = []; let prev = null; for (const z of D.rec) { const w = wrap(z[0]); if (prev !== null && Math.abs(w - prev) > Math.PI) tr.push(null); tr.push([w, z[1]]); prev = w; }
          sS.path(tr, { color: 'accent', width: 1.2, alpha: 0.35 });
          const xs = D.strobe.map((z) => wrap(z[0])), ys = D.strobe.map((z) => z[1]);
          if (D.P) sS.dots(D.strobe.slice(-D.P).map((z) => [wrap(z[0]), z[1]]), { r: 5.5, color: 'red' }); else fastDots(v, sS, xs, ys, xs.length, 'red', { alpha: 0.85, size: 2.2 });
          sS.dot(wrap(q), D.rec[i][1], { r: 5, color: 'gold' });
          // pendulum and the drive
          sR.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 4] });
          const drive = Math.cos(TAU * tau); sR.arrow(0, 1.2, 0.5 * drive, 1.2, { color: 'orange', width: 2.4, head: 8 }); sR.text('drive', 0, 1.2, { color: 'orange', size: 12, dy: -12 });
          drawPendulum(sR, q, 1, { color: 'gold' });
          // time series
          const span = Math.max(1, D.hi - D.lo); sT.setView([0, NC], [D.lo - 0.12 * span, D.hi + 0.12 * span]);
          for (let k = 0; k < NC; k += 2) sT.vband(k, k + 1, { color: 'muted', alpha: 0.06 });
          sT.path(D.rec.map((z, k) => [k / 60, z[0]]), { color: 'accent', width: 1.8 });
          for (let k = 0; k <= NC; k++) sT.dot(k, D.rec[k * 60][0], { r: 3.5, color: 'red' });
          sT.vline(tau, { color: 'gold', width: 1.4 });
          cur = D;
        }, { period: NC / 0.55, still: 5 });
        v.legend([['red', 'state once per drive cycle'], ['accent', 'trajectory / φ(t)'], ['gold', 'now'], ['orange', 'drive torque']]);
        v.readout(() => {
          if (!cur) return '';
          const D = cur, vals = D.P ? D.strobe.slice(-D.P).map((z) => v.fix(wrap(z[0]), 3)).join(', ') : '';
          return String.raw`$\gamma = ${v.fix(D.g, 4)}$ · ` + (D.P ? String.raw`**period ${D.P}**: the stroboscopic angle cycles through ${vals} rad` : '**no period up to 32** in 600 drive cycles: chaotic') + String.raw` · Lyapunov exponent of the stroboscopic map ${v.fix(D.lam, 3)} per cycle ${D.lam > 0.02 ? '(> 0: chaos)' : D.lam > -0.05 ? '(≈ 0: at a bifurcation)' : '(< 0: stable periodic motion)'}` + (D.rolls ? ' · the pendulum rolls over the top' : '');
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 13.14
    {
      num: '13.14',
      kind: 'Phenomenon',
      name: 'Period doubling and Feigenbaum universality',
      statement: String.raw`In many dissipative systems with one control parameter $\mu$, a periodic orbit loses stability through a multiplier passing $-1$ and is replaced by an orbit of twice the period. This repeats at parameter values $\mu_1 < \mu_2 < \mu_3 < \cdots$ that converge geometrically to an accumulation point $\mu_\infty$, beyond which the motion is chaotic. **Feigenbaum universality**: for every system whose return map is effectively one-dimensional with a quadratic maximum, the ratios of successive intervals tend to the same number,
$$\delta = \lim_{n\to\infty}\frac{\mu_n - \mu_{n-1}}{\mu_{n+1} - \mu_n} = 4.669201609\ldots,$$
and the widths of the forks shrink by the factor $\alpha = 2.502907875\ldots$ The logistic map $x \mapsto rx(1-x)$ (ode-11.3), the driven damped pendulum (13.13), dripping faucets, convection cells and electronic circuits all show the same $\delta$. The superstable parameters $R_n$, where the $2^n$-cycle passes through the maximum of the map, accumulate at the same rate and are easier to compute accurately.`,
      idea: String.raw`Look at the second iterate $f^2$ near its period-two points at the parameter where they are superstable: rescaled by $-\alpha$, it looks like $f$ itself at an earlier parameter. Period doubling is therefore a renormalisation $\mathcal R f = -\alpha f^2(\cdot/\alpha)$ acting on the space of unimodal maps. This operator has a fixed point $g$, and at that fixed point exactly one eigenvalue is larger than 1, namely $\delta$; the scaling factor $\alpha$ comes from $g$ itself (ode-11.9). Any one-parameter family crosses the stable manifold of $g$ transversally, so near the accumulation point its bifurcation points are spaced by powers of $\delta$, whatever the details of the system. A strongly dissipative flow such as the driven pendulum has a stroboscopic map that is nearly one-dimensional, so it falls in the same universality class.`,
      caption: String.raw`Top: the bifurcation diagram, computed column by column. For each value of the control parameter the system is run past its transient, starting from the previous column’s state, and the angle at each drive cycle is plotted (pendulum), or the iterates $x_n$ (logistic map). Dashed lines mark the period-doubling thresholds of the pendulum, located precisely by following each periodic orbit with Newton’s method and finding where a Floquet multiplier crosses $-1$, or the superstable parameters $R_n$ of the logistic map, found by Newton’s method. Zoom in to see the cascade repeat in miniature. Bottom: the measured ratios $\delta_n$ for both systems, approaching the same horizontal line $4.6692$.`,
      deps: ['mech-13.13', 'ode-11.3', 'ode-11.8'],
      refs: ['Taylor §12.6'],
      tags: ['period doubling', 'Feigenbaum constant', 'universality'],
      credit: 'Feigenbaum, 1978; Coullet & Tresser, 1978',
      viz(v) {
        const sys = v.select('system', [{ value: 'pend', label: 'driven pendulum' }, { value: 'log', label: 'logistic map' }], 'pend');
        const win = v.select('window', [{ value: 'full', label: 'whole cascade' }, { value: 'zoom', label: 'zoom on the accumulation' }], 'full');
        const WIN = { pend: { full: [1.06, 1.087], zoom: [1.0804, 1.0831] }, log: { full: [2.8, 4], zoom: [3.54, 3.574] } }, NCOL = 360, NPT = 48;
        const sD = v.stage({ x: [1.06, 1.087], y: [-1, 0], axes: 'box', gutter: true, height: 340, full: true, xlabel: 'γ', ylabel: 'φ' });
        const sF = v.stage({ x: [0.5, 11.5], y: [4.5, 4.9], axes: 'box', gutter: true, height: 200, full: true, xlabel: 'n', ylabel: 'δₙ', title: 'measured ratios of successive intervals' });
        const job = progressive(v);
        // pendulum diagram: generator over columns, continuation from column to column
        const diagrams = {};
        const pendDiagram = (w) => {
          const key = w.join('|'); if (diagrams[key]) return diagrams[key];
          const D = { cols: [], done: false }; diagrams[key] = D;
          D.gen = (function* () { const y = [-Math.PI / 2, 0]; for (let k = 0; k < 300; k++) ddpPeriod(y, w[0], 50); for (let c = 0; c < NCOL; c++) { const g = w[0] + ((w[1] - w[0]) * (c + 0.5)) / NCOL; for (let k = 0; k < 170; k++) ddpPeriod(y, g, 50); const ys = new Float32Array(NPT); for (let k = 0; k < NPT; k++) { ddpPeriod(y, g, 50); ys[k] = wrap(y[0]); } D.cols.push({ g, ys }); yield; } D.done = true; })();
          return D;
        };
        // Floquet thresholds of the pendulum (generator; yields between Newton solves)
        const TH = { th: [], done: false };
        TH.gen = (function* () {
          let y = [-Math.PI / 2, 0]; for (let k = 0; k < 200; k++) ddpPeriod(y, 1.06, 50);
          let orb = ddpNewton(y[0], y[1], 1.06, 1), gl = 1.06;
          for (let k = 0; k < 4 && orb; k++) {
            const n = 2 ** k, f = (g, o) => { const r = ddpNewton(o.q, o.p, g, n); return r ? { r, v: r.tr + 1 + r.det } : null; };
            let g = gl, cur = f(g, orb), step = 0.003 / 4.67 ** k, found = false; yield;
            for (let guard = 0; guard < 200 && cur && !found; guard++) {
              const g2 = g + step, nx = f(g2, cur.r); yield;
              if (!nx) { step /= 2; continue; }
              if (nx.v < 0) {
                let a = g, b = g2, oa = cur.r; for (let it = 0; it < 44; it++) { const m = (a + b) / 2, fm = f(m, oa); if (fm && fm.v > 0) { a = m; oa = fm.r; } else b = m; if (it % 4 === 0) yield; }
                const gc = (a + b) / 2; TH.th.push(gc);
                const gn = gc + (g2 - g) * 0.4; let z = [oa.q + 0.01, oa.p]; for (let kk = 0; kk < 300 + 400 * k; kk++) { ddpPeriod(z, gn, 40); if (kk % 50 === 0) yield; }
                orb = ddpNewton(z[0], z[1], gn, 2 * n); if (orb && Math.hypot(orb.q - oa.q, orb.p - oa.p) < 1e-6) orb = null; gl = gn; found = true;
              } else { g = g2; cur = nx; }
            }
          }
          TH.done = true;
        })();
        // logistic map: superstable parameters R_n by Newton, diagram computed directly
        const logR = (() => {
          const R = [2, 1 + Math.sqrt(5)], D = [];
          const g = (r, n) => { let x = 0.5, dx = 0; for (let i = 0; i < 2 ** n; i++) { dx = x * (1 - x) + r * (1 - 2 * x) * dx; x = r * x * (1 - x); } return [x - 0.5, dx]; };
          for (let n = 2; n <= 12; n++) { let r = R[n - 1] + (R[n - 1] - R[n - 2]) / 4.7; for (let it = 0; it < 40; it++) { const [f, df] = g(r, n); const dr = f / df; r -= dr; if (Math.abs(dr) < 1e-15) break; } R.push(r); }
          for (let n = 1; n < R.length; n++) { let x = 0.5; for (let i = 0; i < 2 ** (n - 1); i++) x = R[n] * x * (1 - x); D.push(x - 0.5); }
          return { R, d: D };
        })();
        const logCache = memo();
        const logDiagram = (w) => logCache(w.join('|'), () => { const cols = []; for (let c = 0; c < 520; c++) { const r = w[0] + ((w[1] - w[0]) * (c + 0.5)) / 520; let x = 0.5; for (let k = 0; k < 600; k++) x = r * x * (1 - x); const ys = new Float32Array(120); for (let k = 0; k < 120; k++) { x = r * x * (1 - x); ys[k] = x; } cols.push({ g: r, ys }); } return { cols, done: true }; });
        const deltas = (t) => { const out = []; for (let i = 0; i + 2 < t.length; i++) out.push((t[i + 1] - t[i]) / (t[i + 2] - t[i + 1])); return out; };
        let cur = null;
        v.render(() => {
          const w = WIN[sys.value][win.value], pend = sys.value === 'pend';
          const D = pend ? pendDiagram(w) : logDiagram(w);
          job.run((budget) => {
            const t0 = now();
            if (pend && !D.done) while (now() - t0 < budget) { if (D.gen.next().done) break; }
            if (!TH.done) while (now() - t0 < budget) { if (TH.gen.next().done) break; }
            return (!pend || D.done) && TH.done;
          }, 28);
          let lo = Infinity, hi = -Infinity; for (const c of D.cols) for (const y of c.ys) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
          if (!isFinite(lo)) { lo = -1; hi = 0; } const pad = 0.06 * (hi - lo || 1);
          sD.setView(w, pend ? [lo - pad, hi + pad] : [win.value === 'full' ? 0 : lo - pad, win.value === 'full' ? 1 : hi + pad]);
          sD.setLabels(pend ? 'drive strength γ' : 'r', pend ? 'φ at each drive cycle (rad)' : 'xₙ');
          const xs = [], ys = []; for (const c of D.cols) for (const y of c.ys) { xs.push(c.g); ys.push(y); }
          fastDots(v, sD, xs, ys, xs.length, 'accent', { alpha: 0.55, size: 1.4 });
          const marks = pend ? TH.th : logR.R.slice(1);
          let lastX = -1e9;
          marks.forEach((m, k) => { if (m < w[0] || m > w[1]) return; sD.vline(m, { color: pend ? 'orange' : 'teal', width: 1.1, dash: [4, 4] }); const X = sD.X(m); if (X - lastX < 24) return; lastX = X; sD.text(pend ? `γ${'₁₂₃₄₅'[k]}` : `R${'₁₂₃₄₅₆₇₈₉'[k] || ''}`, m, sD.bounds.y[1], { color: pend ? 'orange' : 'teal', size: 12, dx: -3, align: 'right', baseline: 'top', dy: 4 }); });
          if (pend && !D.done) sD.corner(`computing… ${D.cols.length}/${NCOL} columns`, 'br', { color: 'ink', plate: true });
          // δ_n
          const dl = deltas(logR.R.slice(1)), dp = deltas(TH.th);
          sF.hline(4.669201609, { color: 'green', width: 1.6 }); sF.text('δ = 4.6692…', 11.4, 4.669201609, { color: 'green', size: 12, align: 'right', dy: -10 });
          sF.path(dl.map((d, i) => [i + 1, d]), { color: 'teal', width: 1.6 }); sF.dots(dl.map((d, i) => [i + 1, d]), { r: 4, color: 'teal' });
          if (dp.length) { sF.path(dp.map((d, i) => [i + 1, d]), { color: 'orange', width: 1.6 }); sF.dots(dp.map((d, i) => [i + 1, d]), { r: 5, color: 'orange' }); }
          if (!TH.done) sF.corner('locating the pendulum’s thresholds…', 'tl', { color: 'muted' });
          cur = { dl, dp };
        });
        v.legend([['accent', 'bifurcation diagram'], ['orange', 'pendulum: Floquet thresholds γₙ and δₙ', { dash: true }], ['teal', 'logistic map: superstable Rₙ and δₙ', { dash: true }], ['green', 'Feigenbaum’s δ']]);
        v.readout(() => {
          if (!cur) return '';
          const { dl, dp } = cur, R = logR.R, d = logR.d, al = -d[d.length - 2] / d[d.length - 1];
          const pt = TH.th.length ? `pendulum thresholds γₙ = ${TH.th.map((x) => v.fix(x, 6)).join(', ')}` : 'pendulum thresholds: computing';
          return String.raw`${pt}` + (dp.length ? String.raw` → $\delta_1 = ${v.fix(dp[0], 3)}$${dp[1] ? String.raw`, $\delta_2 = ${v.fix(dp[1], 3)}$` : ''}` : '') + String.raw` · logistic map: $R_\infty \approx ${v.fix(R[R.length - 1], 7)}$, $\delta_{${dl.length}} = ${v.fix(dl[dl.length - 1], 5)}$, fork-width ratio $\alpha \approx ${v.fix(al, 4)}$ (Feigenbaum: $\delta = 4.669202$, $\alpha = 2.502908$)`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 13.16
    {
      num: '13.16',
      kind: 'Phenomenon',
      name: 'Malkus waterwheel and the Lorenz attractor',
      statement: String.raw`A wheel tilted in a vertical plane carries leaky cups around its rim. Water pours in at the top, leaks out of every cup at a rate proportional to its content, and the wheel is braked by friction. Let $\omega$ be the angular velocity and expand the mass per unit angle in the lab frame as $m(\theta, t) = a_0 + a_1\sin\theta + b_1\cos\theta + \cdots$, with $\theta$ measured from the top. Then the first harmonics decouple and obey
$$I\dot\omega = -\nu\omega + \pi g r\,a_1,\qquad \dot a_1 = \omega b_1 - Ka_1,\qquad \dot b_1 = -\omega a_1 - Kb_1 + q_1 .$$
After rescaling, $x \propto \omega$, $y \propto a_1$ (the horizontal offset of the centre of mass), $z = \rho - (\text{const})\,b_1$, these are exactly the **Lorenz equations**
$$\dot x = \sigma(y - x),\qquad \dot y = \rho x - y - xz,\qquad \dot z = xy - bz,$$
with $b = 1$, $\sigma = \nu/(IK)$ and $\rho$ proportional to the inflow. For small inflow the wheel stays at rest ($\rho < 1$). Above that it turns steadily one way or the other, and for $\rho > \rho_H = \sigma(\sigma + b + 3)/(\sigma - b - 1)$ steady rotation is unstable, and the wheel speeds up, slows down and reverses direction at irregular times, forever. The orbit then lies on the **Lorenz attractor**, a strange attractor of zero volume (the flow contracts volume at the rate $\sigma + b + 1$) whose fractal dimension is slightly above 2. With Lorenz’s 1963 values $\sigma = 10$, $b = 8/3$, $\rho = 28$, the dimension is about 2.06 and the largest Lyapunov exponent about 0.9.`,
      scope: String.raw`The truncation to the first Fourier harmonics is exact for this idealised wheel (the higher harmonics decay on their own); Lorenz derived the same equations as a severe truncation of thermal convection.`,
      idea: String.raw`If the wheel turns a little faster, cups spend less time under the inflow and the heavy side moves further round before it empties. The resulting torque can overshoot and reverse the rotation: a delayed feedback that is unstable once the inflow is large enough (a subcritical Hopf bifurcation at $\rho_H$). The divergence of the Lorenz field is the constant $-(\sigma + 1 + b)$, so volumes contract exponentially (13.12) while orbits stay in a bounded region; the unstable fixed points stretch neighbouring orbits apart (13.4). The attractor therefore has zero volume but is not a surface: it is a Cantor set of sheets. Box counting estimates its dimension from the number of boxes $N(\varepsilon)$ of size $\varepsilon$ needed to cover it, $N \sim \varepsilon^{-D}$; the correlation sum, the fraction of pairs of points closer than $r$, scales like $r^{D_2}$ and converges faster from a finite sample.`,
      caption: String.raw`**Waterwheel** ($b = 1$, $\sigma = 10$): water pours in at the top, and each cup shows how full it is, computed from the mass distribution $a_0 + a_1\sin\theta + b_1\cos\theta$. Right: angular velocity against the depth of the centre of mass, tracing the butterfly, and below it $\omega(t)$, with reversals marked. Lower $\rho$ below $\rho_H$ and the wheel settles into steady rotation; raise it and it reverses erratically. **Lorenz attractor**: the classic $b = 8/3$ attractor, which you can rotate. Below it the measured box-counting and correlation sums on log–log axes, whose slopes estimate the fractal dimension. The box count bends at small boxes because 150 000 points cannot fill them, which is why the correlation estimate is more reliable.`,
      deps: ['mech-13.12', 'mech-13.4'],
      see: ['ode-10.2', 'ode-10.6'],
      refs: ['Goldstein §11.9'],
      tags: ['Lorenz attractor', 'waterwheel', 'fractal dimension'],
      credit: 'Lorenz, 1963; Malkus & Howard, c. 1970',
      viz(v) {
        const view = v.select('view', [{ value: 'wheel', label: 'the waterwheel ($b = 1$)' }, { value: 'dim', label: 'Lorenz attractor and its dimension ($b = 8/3$)' }], 'wheel');
        const rS = v.slider('inflow, as the Rayleigh number $\\rho$', 0.5, 40, 28, { step: 0.1 });
        const SIG = 10, TT = 40, H = 0.004, EV = 3, NCUP = 12;
        const sW = v.stage({ x: [-1.45, 1.45], y: [-1.35, 1.6], equal: true, axes: false, height: 330, weight: 0.85, title: 'the wheel' });
        const sB = v.stage({ x: [-25, 25], y: [-30, 30], axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: 'angular velocity ω (scaled)', ylabel: 'depth of the centre of mass (scaled)' });
        const sT = v.stage({ x: [0, TT], y: [-25, 25], axes: 'box', gutter: true, height: 170, full: true, xlabel: 't (units of 1/K)', ylabel: 'ω' });
        const s3 = v.stage3d({ range: 31, height: 330, yaw: -0.5, pitch: 0.25, axes: false, full: true, title: 'the Lorenz attractor ($\\sigma = 10$, $b = 8/3$)' });
        const sN = v.stage({ x: [0.15, 30], y: [1, 2e5], xlog: true, ylog: true, axes: 'box', gutter: true, height: 260, xlabel: 'box size ε', ylabel: 'boxes N(ε)', title: 'box counting: slope = −D' });
        const sC = v.stage({ x: [0.05, 40], y: [1e-6, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 260, xlabel: 'r', ylabel: 'C(r)', title: 'correlation sum: slope = D₂' });
        const wc = memo(), dc = memo();
        const wheel = () => wc(rS.value, () => {
          const rho = rS.value, b = 1, tr = lorenzRun(SIG, rho, b, 30, H, 1000, [0.5, 0.3, rho * 0.6]).pop(), P = lorenzRun(SIG, rho, b, TT, H, EV, tr);
          let ang = 0; const th = [0]; for (let i = 1; i < P.length; i++) { ang += P[i][0] * H * EV * 0.35; th.push(ang); }
          let amax = 1e-9; for (const p of P) amax = Math.max(amax, Math.hypot(p[1], rho - p[2])); const a0 = amax * 1.04;
          const rev = []; for (let i = 1; i < P.length; i++) if (P[i - 1][0] * P[i][0] < 0) rev.push(i * H * EV);
          let xm = 1; for (const p of P) xm = Math.max(xm, Math.abs(p[0])); let zl = Infinity, zh = -Infinity; for (const p of P) { zl = Math.min(zl, p[2] - rho); zh = Math.max(zh, p[2] - rho); }
          return { P, th, a0, rev, rho, xm, zl, zh, rhoH: (SIG * (SIG + b + 3)) / (SIG - b - 1) };
        });
        const dims = () => dc(rS.value, () => {
          const rho = rS.value, b = 8 / 3, start = lorenzRun(SIG, rho, b, 40, 0.005, 8000, [1, 1, 20]).pop(), N = 150000, P = lorenzRun(SIG, rho, b, N * 0.02, 0.005, 4, start);
          // largest Lyapunov exponent from a renormalised twin
          let A = start.slice(), B = [start[0] + 1e-8, start[1], start[2]], S = 0; const d0 = 1e-8;
          for (let k = 0; k < 400; k++) { A = lorenzRun(SIG, rho, b, 0.25, 0.005, 50, A).pop(); B = lorenzRun(SIG, rho, b, 0.25, 0.005, 50, B).pop(); const d = Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); S += Math.log(d / d0); B = [A[0] + ((B[0] - A[0]) * d0) / d, A[1] + ((B[1] - A[1]) * d0) / d, A[2] + ((B[2] - A[2]) * d0) / d]; }
          const box = []; for (let e = 24; e >= 0.2; e /= Math.SQRT2) { const set = new Set(); for (const p of P) set.add(Math.floor((p[0] + 60) / e) * 1e8 + Math.floor((p[1] + 60) / e) * 1e4 + Math.floor((p[2] + 10) / e)); box.push([e, set.size]); }
          const M = 1600, idx = Array.from({ length: M }, (_, i) => Math.floor((i * P.length) / M)), bins = new Float64Array(64);
          for (let i = 0; i < M; i++) for (let j = i + 1; j < M; j++) { const a = P[idx[i]], c = P[idx[j]], d = Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]); const k = Math.floor(Math.log2(Math.max(d, 1e-9)) * 4 + 24); bins[clamp(k, 0, 63)]++; }
          const tot = (M * (M - 1)) / 2, cor = []; let cum = 0; for (let k = 0; k < 64; k++) { cum += bins[k]; const r = 2 ** ((k + 1 - 24) / 4); if (r >= 0.05 && r <= 40 && cum > 0) cor.push([r, cum / tot]); }
          const fb = box.filter((q) => q[0] >= 0.7 && q[0] <= 6), fc = cor.filter((q) => q[0] >= 0.5 && q[0] <= 3.5);
          const lb = fitLine(fb.map((q) => Math.log(q[0])), fb.map((q) => Math.log(q[1]))), lc = fitLine(fc.map((q) => Math.log(q[0])), fc.map((q) => Math.log(q[1])));
          return { P, box, cor, Db: -lb.slope, Dc: lc.slope, lb, lc, lam: S / (400 * 0.25), rho };
        });
        let cur = null;
        v.animate((tt) => {
          const wh = view.value === 'wheel';
          for (const s of [sW, sB, sT]) s.el.style.display = wh ? '' : 'none';
          for (const s of [s3, sN, sC]) s.el.style.display = wh ? 'none' : '';
          if (wh) {
            const D = wheel(), tau = (1.6 * tt) % TT, i = Math.min(D.P.length - 1, Math.round(tau / (H * EV))), p = D.P[i], rho = D.rho, a1 = p[1], b1 = rho - p[2];
            // the wheel: inflow, rim, cups with their water
            sW.rect(-0.07, 1.12, 0.07, 1.6, { fill: 'blue', fillAlpha: 0.35, stroke: false });
            sW.circle(0, 0, 1, { color: 'ink', width: 2 }); sW.dot(0, 0, { r: 4, color: 'ink' });
            for (let k = 0; k < NCUP; k++) {
              const th = D.th[i] + (TAU * k) / NCUP, cx = -Math.sin(th), cy = Math.cos(th), m = clamp((D.a0 + a1 * Math.sin(th) + b1 * Math.cos(th)) / (2 * D.a0), 0, 1);
              sW.line(0, 0, cx, cy, { color: 'faint', width: 1 });
              sW.rect(cx - 0.11, cy - 0.15, cx + 0.11, cy + 0.05, { color: 'ink', width: 1.4, fill: 'panel', fillAlpha: 1 });
              if (m > 0.005) sW.rect(cx - 0.1, cy - 0.14, cx + 0.1, cy - 0.14 + 0.18 * m, { fill: 'blue', fillAlpha: 0.75, stroke: false });
            }
            const xcm = -Math.PI * a1, ycm = Math.PI * b1, sc = 0.9 / (Math.PI * D.a0); sW.dot(xcm * sc, ycm * sc, { r: 5.5, color: 'red' });
            sW.corner(p[0] > 0.5 ? 'turning ↺' : p[0] < -0.5 ? 'turning ↻' : 'nearly still', 'tl', { color: 'ink', plate: true });
            // butterfly: ω against depth of the centre of mass (∝ z − ρ)
            sB.setView([-1.15 * D.xm, 1.15 * D.xm], [D.zl - 0.1 * (D.zh - D.zl + 1), D.zh + 0.1 * (D.zh - D.zl + 1)]);
            sB.path(D.P.slice(0, i + 1).map((q) => [q[0], q[2] - rho]), { color: 'accent', width: 1, alpha: 0.6 });
            sB.dot(p[0], p[2] - rho, { r: 5, color: 'red' });
            sT.setView([0, TT], [-1.15 * D.xm, 1.15 * D.xm]);
            sT.hline(0, { color: 'faint', width: 1 });
            sT.path(D.P.map((q, k) => [k * H * EV, q[0]]), { color: 'accent', width: 1.5 });
            for (const r of D.rev) sT.vline(r, { color: 'orange', width: 1, alpha: 0.5 });
            sT.vline(tau, { color: 'red', width: 1.4 });
            cur = { wh, D, tau };
          } else {
            const D = dims();
            const pts = []; for (let k = 0; k < 4000; k++) pts.push([D.P[k][0], D.P[k][1], D.P[k][2] - 25]);
            s3.path(pts, { color: 'accent', width: 1, alpha: 0.6 });
            sN.path(D.box, { color: 'accent', width: 1.4 }); sN.dots(D.box, { r: 3.5, color: 'accent' });
            sN.fn((e) => Math.exp(D.lb.intercept + D.lb.slope * Math.log(e)), { color: 'red', width: 1.4, dash: [6, 4], domain: [0.5, 9] });
            sN.vband(0.7, 6, { color: 'red', alpha: 0.05 });
            sC.path(D.cor, { color: 'purple', width: 1.4 }); sC.dots(D.cor, { r: 3, color: 'purple' });
            sC.fn((r) => Math.exp(D.lc.intercept + D.lc.slope * Math.log(r)), { color: 'red', width: 1.4, dash: [6, 4], domain: [0.3, 6] });
            sC.vband(0.5, 3.5, { color: 'red', alpha: 0.05 });
            cur = { wh, D };
          }
        }, { period: TT / 1.6, still: 14 });
        v.legend([['blue', 'water'], ['red', 'centre of mass / now / fitted slope'], ['accent', 'orbit, $\\omega(t)$, box counts'], ['orange', 'reversals of the wheel'], ['purple', 'correlation sum']]);
        v.readout(() => {
          if (!cur) return '';
          if (cur.wh) {
            const { D } = cur, rho = D.rho;
            const regime = rho < 1 ? 'below 1: the wheel stays at rest' : rho < D.rhoH ? 'between 1 and $\\rho_H$: after a transient the wheel turns steadily' : 'above $\\rho_H$: steady rotation is unstable and the wheel reverses at irregular times';
            return String.raw`$\rho = ${v.fix(rho, 1)}$, Hopf threshold $\rho_H = \sigma(\sigma + b + 3)/(\sigma - b - 1) = ${v.fix(D.rhoH, 2)}$ for $\sigma = 10$, $b = 1$ — ${regime} · reversals in this window: ${D.rev.length}`;
          }
          const { D } = cur;
          return String.raw`$\rho = ${v.fix(D.rho, 1)}$ · dimension estimates from ${D.P.length.toLocaleString('en')} points: box counting ${v.fix(D.Db, 2)} (biased low at small boxes), correlation $D_2 = ${v.fix(D.Dc, 2)}$ · largest Lyapunov exponent ${v.fix(D.lam, 2)} · volume contraction rate $\sigma + b + 1 = ${v.fix(SIG + 1 + 8 / 3, 3)}$` + (D.rho < 24.74 ? ' · below $\\rho_H \\approx 24.74$ the orbit settles on a fixed point (dimension 0)' : '');
        });
      },
    },
  ],
};
