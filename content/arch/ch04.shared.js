// Architecture & Structural Form — Chapter 4 shared helpers (plain named exports).
//
// Re-exports the chapter 3 helpers (the masonry-arch engine and everything it re-exports), then adds
//   * membrane theory of shells of revolution under their weight (profile builders and the two membrane forces),
//   * a "dome slice" builder: a diametral section of a dome with the weight of a gore (lune), so the chapter 3 thrust-line
//     engine can check a slice of a cracked dome,
//   * the cross-vault load model (webs leaning on the groins) and a small thrust-network (force-density) solver.
export * from './ch03.shared.js';

const D2R = Math.PI / 180;
export const deg = (r) => (r * 180) / Math.PI;

// ── shells of revolution: profiles and membrane forces ───────────────────────────────────────────────────────────────
/**
 * Profile of a shell of revolution, from the crown (or the edge of an oculus) down to the base, as an array of nodes
 * {r, z, psi (slope of the meridian above the horizontal, rad), rho1 (meridional radius of curvature), s (arc length)}.
 *   sphere : {type: 'sphere', R, phi0 = 0, phi1 = 90°}   (phi measured from the vertical axis, degrees)
 *   pointed: {type: 'pointed', S (span), k (arc radius / span; 0.5 = semicircle, 0.8 = "quinto acuto"), n}
 * The base lies at z = 0 and the crown at z = rise.
 */
export function profile(o = {}) {
  const n = o.n ?? 240, P = [];
  if (o.type === 'pointed') {
    const S = o.S ?? 2, Rc = (o.k ?? 0.8) * S, rc = S / 2 - Rc, bTop = Math.acos(Math.max(-1, Math.min(1, -rc / Rc)));
    const b0 = Math.max(bTop * (o.eps ?? 0.004), 1e-4);
    for (let i = 0; i <= n; i++) {
      const b = bTop - b0 - (bTop - b0) * (i / n);
      P.push({ r: rc + Rc * Math.cos(b), z: Rc * Math.sin(b), psi: Math.PI / 2 - b, rho1: Rc, beta: b });
    }
  } else {
    const R = o.R ?? 1, p0 = (o.phi0 ?? 0) * D2R, p1 = (o.phi1 ?? 90) * D2R, e = p0 === 0 ? 1e-4 : 0;
    for (let i = 0; i <= n; i++) {
      const p = p0 + e + (p1 - p0 - e) * (i / n);
      P.push({ r: R * Math.sin(p), z: R * Math.cos(p), psi: p, rho1: R, phi: p });
    }
  }
  let s = 0;
  P.forEach((q, i) => { if (i) s += Math.hypot(q.r - P[i - 1].r, q.z - P[i - 1].z); q.s = s; });
  const z1 = P[P.length - 1].z; P.forEach((q) => { q.z -= z1; });
  return P;
}
/**
 * Membrane forces (per unit length; compression negative, tension positive) of a shell of revolution carrying a weight
 * w(node) per unit surface area (w may be a number or a function of the node), plus an optional ring load L (total, at
 * the top edge). Returns {Nphi[], Ntheta[], W[]} aligned with the nodes. Valid while sin(psi) > 0.
 *   N_phi   = -(W + L) / (2 pi r sin psi)
 *   N_theta = rho2 (-w cos psi - N_phi / rho1),   rho2 = r / sin psi
 */
export function membrane(P, w, L = 0) {
  const wf = typeof w === 'function' ? w : () => w, W = [];
  // a closed crown starts at r ≈ 0: the small cap above the first node is treated as a cone
  const rmax = Math.max(...P.map((q) => q.r)), p0 = P[0];
  let acc = p0.r < 0.03 * rmax ? wf(p0, 0) * Math.PI * p0.r * p0.r / Math.cos(p0.psi) : 0;
  P.forEach((q, i) => {
    if (i) { const p = P[i - 1]; acc += 0.5 * (wf(p, i - 1) * p.r + wf(q, i) * q.r) * 2 * Math.PI * (q.s - p.s); }
    W.push(acc);
  });
  // the first node of a closed crown has r ≈ 0: the cap above it is negligible
  const Nphi = [], Nth = [];
  P.forEach((q, i) => {
    const sp = Math.sin(q.psi), rho2 = q.r / sp;
    const Np = -(W[i] + L) / (2 * Math.PI * q.r * sp);
    Nphi.push(Np); Nth.push(rho2 * (-wf(q, i) * Math.cos(q.psi) - Np / q.rho1));
  });
  return { Nphi, Ntheta: Nth, W };
}
/** First polar angle (rad) at which the hoop force becomes tensile, scanning from the crown; null if never. */
export function hoopZero(P, Nth) {
  for (let i = 1; i < P.length; i++) if (Nth[i - 1] <= 0 && Nth[i] > 0) { const f = -Nth[i - 1] / (Nth[i] - Nth[i - 1]); return P[i - 1].psi + f * (P[i].psi - P[i - 1].psi); }
  return null;
}

// ── a diametral slice of a dome, with the weight of one gore ─────────────────────────────────────────────────────────
/**
 * Arch-engine geometry for a diametral section of a dome. `mid` lists the right-hand half of the mid-surface from the
 * crown (x = 0) down to the base, as [x, z]; `thick(i)` (number or function of the index) is the shell thickness
 * measured normal to the surface. The section is cut into 2 (mid.length - 1) voussoirs by normal joints. Each voussoir
 * weighs gamma * dtheta * ∫|x| dA, the weight of the gore of angular width dtheta that it belongs to, so the slice is the
 * arch that one gore forms with its opposite gore, and the engine of chapter 3 (thrust lines, hinges, minimum thickness)
 * applies unchanged.
 */
export function domeSlice(mid, thick, { gamma = 22, dtheta = 2 * Math.PI / 50 } = {}) {
  const m = mid.length - 1, tf = typeof thick === 'function' ? thick : () => thick;
  const R = mid.map((p, i) => ({ p, i })), pts = [...R.slice(1).reverse().map(({ p, i }) => ({ p: [-p[0], p[1]], i })), ...R];
  const n = pts.length, joints = pts.map(({ p, i }, k) => {
    const p0 = pts[Math.max(0, k - 1)].p, p1 = pts[Math.min(n - 1, k + 1)].p, dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy), tau = [dx / L, dy / L], nn = [-tau[1], tau[0]], t = tf(i);
    return { a: [p[0] - nn[0] * t / 2, p[1] - nn[1] * t / 2], b: [p[0] + nn[0] * t / 2, p[1] + nn[1] * t / 2], tau };
  });
  const blocks = [];
  for (let k = 0; k < n - 1; k++) {
    const poly = [joints[k].a, joints[k + 1].a, joints[k + 1].b, joints[k].b];
    let A = 0, I1 = 0, I2 = 0, ay = 0;
    for (let i = 0; i < 4; i++) { const p = poly[i], q = poly[(i + 1) % 4], c = p[0] * q[1] - q[0] * p[1]; A += c; I1 += (p[0] + q[0]) * c / 6; I2 += (p[0] ** 2 + p[0] * q[0] + q[0] ** 2) * c / 12; ay += (p[1] + q[1]) * c / 6; }
    const sg = Math.sign(A) || 1; A *= sg; I1 *= sg; I2 *= sg; ay *= sg;
    blocks.push({ poly, area: A, W: gamma * dtheta * Math.abs(I1), cx: I1 ? I2 / I1 : 0, cy: A ? ay / A : 0, k });
  }
  const g = { joints, blocks, gamma, N: n - 1, W: blocks.reduce((s, b) => s + b.W, 0), c0: [(joints[0].a[0] + joints[0].b[0]) / 2, (joints[0].a[1] + joints[0].b[1]) / 2], xs: joints.map((j) => j.b[0]), half: m, span: 2 * mid[m][0], dtheta };
  g.t = tf(0); g.rise = mid[0][1] - mid[m][1];
  return g;
}
/** Mid-surface points [x, z] of a spherical dome of mean radius R from the crown to the polar angle phi1 (deg), m segments. */
export function sphereMid(R, phi1, m) { return Array.from({ length: m + 1 }, (_, i) => { const p = (phi1 * D2R * i) / m; return [R * Math.sin(p), R * Math.cos(p) - R * Math.cos(phi1 * D2R)]; }); }

// ── cross vaults: webs leaning on the groins ─────────────────────────────────────────────────────────────────────────
/**
 * Load model for a groin (cross) vault of semicircular profile (radius R, bay 2R x 2R), shell thickness t, unit weight
 * gamma, and the barrel vault of the same radius and thickness. Idealisation: each web is cut into slices that lean on
 * the groin, so the whole weight of the web reaches the groin ribs, which carry it to the four corner piers.
 * Everything is computed by numerical integration of the surface weight along the groin (not from a closed form).
 */
export function crossVault(R, t, gamma, n = 400) {
  // load per unit plan length s along one diagonal (s = x = y from the centre): two webs meet there,
  // each slice (x from s to R) of the web weighs gamma t R acos(s/R) per unit width
  const q = (s) => 2 * gamma * t * R * Math.acos(Math.min(1, Math.abs(s) / R));
  let Wd = 0, M0 = 0;
  for (let i = 0; i < n; i++) { const s = (R * (i + 0.5)) / n; Wd += 2 * q(s) * (R / n); M0 += q(s) * Math.SQRT2 * s * (R / n); }
  const Wgroin = 2 * Wd; // two diagonals
  // diagonal arch: semi-ellipse of half-span sqrt2 R and rise R; thrust through the crown at the arch axis (H = M0 / rise)
  const Hd = M0 / R;
  // barrel of the same radius over the same square (length 2R)
  let m0 = 0; for (let i = 0; i < n; i++) { const x = (R * (i + 0.5)) / n; m0 += gamma * t * R / Math.sqrt(R * R - x * x) * x * (R / n); }
  const Hb = m0 / R, Wb = gamma * t * Math.PI * R * 2 * R;
  return { Wgroin, Wbarrel: Wb, pier: Wgroin / 4, Hd, Hbarrel: Hb, Hbarrel_bay: Hb * 2 * R, q };
}

// ── thrust network analysis on a regular plan: straight lines of constant horizontal force ────────────────────────────
/**
 * A plan grid of n x n nodes on [-1, 1]^2 carrying straight lines of thrust: rows (y = const), columns (x = const) and,
 * optionally, the two diagonal families. The horizontal force F of a line is the same along the whole line, so horizontal
 * equilibrium holds at every node by construction (the force diagram is made of parallel segments). The edge force density
 * is q = F / (plan length). Vertical equilibrium of an interior node i, with downward load p_i, reads
 *   sum_j q_ij (z_i - z_j) = p_i,
 * a linear system for the heights z given the force densities and the heights of the boundary nodes (the supports).
 *   Fr(y), Fc(x): force of the row at y / column at x;  Fd(u): force of a diagonal line, u = (x -/+ y)/sqrt2 (null: no diagonals)
 *   p(i, j): downward load of node (i, j);  zb(i, j): support height of a boundary node.
 * Returns {z (n x n), q-edge list, reactions Hx, Hy per boundary node: horizontal thrust vectors}.
 */
export function tnaSolve(n, Fr, Fc, Fd, p, zb) {
  const h = 2 / (n - 1), X = (i) => -1 + i * h, idx = new Map(); let m = 0;
  for (let i = 1; i < n - 1; i++) for (let j = 1; j < n - 1; j++) idx.set(i * n + j, m++);
  const edges = [];
  const add = (i0, j0, i1, j1, F, fam) => { const L = Math.hypot(X(i1) - X(i0), X(j1) - X(j0)); edges.push({ a: [i0, j0], b: [i1, j1], F, q: F / L, fam, L }); };
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    // i = index in x, j = index in y
    if (i + 1 < n) add(i, j, i + 1, j, Fr(X(j)), 'r');
    if (j + 1 < n) add(i, j, i, j + 1, Fc(X(i)), 'c');
    if (Fd && i + 1 < n && j + 1 < n) add(i, j, i + 1, j + 1, Fd((X(i) - X(j)) / Math.SQRT2), 'd');
    if (Fd && i + 1 < n && j - 1 >= 0) add(i, j, i + 1, j - 1, Fd((X(i) + X(j)) / Math.SQRT2), 'e');
  }
  const A = Array.from({ length: m }, () => new Float64Array(m)), b = new Float64Array(m);
  for (let i = 1; i < n - 1; i++) for (let j = 1; j < n - 1; j++) b[idx.get(i * n + j)] = p(i, j);
  const z = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === 0 || j === 0 || i === n - 1 || j === n - 1 ? zb(i, j) : 0)));
  for (const e of edges) {
    const ia = e.a[0] * n + e.a[1], ib = e.b[0] * n + e.b[1], ka = idx.get(ia), kb = idx.get(ib);
    if (ka !== undefined) { A[ka][ka] += e.q; if (kb !== undefined) A[ka][kb] -= e.q; else b[ka] += e.q * z[e.b[0]][e.b[1]]; }
    if (kb !== undefined) { A[kb][kb] += e.q; if (ka !== undefined) A[kb][ka] -= e.q; else b[kb] += e.q * z[e.a[0]][e.a[1]]; }
  }
  // Gaussian elimination (the matrix is symmetric positive definite)
  const M = A.map((r, i) => { const rr = Array.from(r); rr.push(b[i]); return rr; });
  for (let c = 0; c < m; c++) {
    let pv = c; for (let r = c + 1; r < m; r++) if (Math.abs(M[r][c]) > Math.abs(M[pv][c])) pv = r;
    [M[c], M[pv]] = [M[pv], M[c]];
    for (let r = c + 1; r < m; r++) { const f = M[r][c] / M[c][c]; if (!f) continue; for (let k = c; k <= m; k++) M[r][k] -= f * M[c][k]; }
  }
  const sol = new Float64Array(m);
  for (let r = m - 1; r >= 0; r--) { let s = M[r][m]; for (let k = r + 1; k < m; k++) s -= M[r][k] * sol[k]; sol[r] = s / M[r][r]; }
  for (const [key, k] of idx) z[Math.floor(key / n)][key % n] = sol[k];
  return { z, edges, n, h };
}
