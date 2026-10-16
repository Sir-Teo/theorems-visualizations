// Robotics — Chapter 1: helpers shared by ch01.js (plain functions; the math library M is passed in where needed)

export const TAU = 2 * Math.PI;
export const DEG = Math.PI / 180;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
/** Wrap an angle into [−π, π). */
export const wrap = (q) => q - TAU * Math.floor((q + Math.PI) / TAU);
/** Shortest signed difference a − b on the circle. */
export const angDiff = (a, b) => wrap(a - b);

/** Ticks at multiples of π/2 inside [a, b]. */
export function piTicks(a, b, step = 0.5) {
  const lab = (k) => { const n = k * step; if (Math.abs(n) < 1e-9) return '0'; const s = n < 0 ? '−' : ''; const m = Math.abs(n); return s + (m === 1 ? 'π' : Number.isInteger(m) ? `${m}π` : m === 0.5 ? 'π/2' : `${Math.round(m * 2)}π/2`); };
  const out = []; for (let k = Math.ceil(a / (Math.PI * step) - 1e-9); k * Math.PI * step <= b + 1e-9; k++) out.push([k * Math.PI * step, lab(k)]);
  return out;
}

// ── planar arms ───────────────────────────────────────────────────────────────
/** Forward kinematics of a planar nR arm: joint positions [[0,0], p1, …, tip] and the tool angle. */
export function fkChain(ls, qs) {
  const pts = [[0, 0]]; let a = 0, x = 0, y = 0;
  for (let i = 0; i < ls.length; i++) { a += qs[i]; x += ls[i] * Math.cos(a); y += ls[i] * Math.sin(a); pts.push([x, y]); }
  return { pts, phi: a };
}
/** Closed-form IK of the planar 2R arm for a target (x, y): both branches, null when out of reach. */
export function ik2(l1, l2, x, y) {
  const d2 = x * x + y * y, c2 = (d2 - l1 * l1 - l2 * l2) / (2 * l1 * l2);
  if (c2 > 1 + 1e-12 || c2 < -1 - 1e-12) return null;
  const c = clamp(c2, -1, 1), out = [];
  for (const s of [1, -1]) { const t2 = s * Math.acos(c); const t1 = Math.atan2(y, x) - Math.atan2(l2 * Math.sin(t2), l1 + l2 * Math.cos(t2)); out.push([wrap(t1), t2]); }
  return out;
}
/** Distance from point c to segment pq. */
export function segPointDist(p, q, c) {
  const dx = q[0] - p[0], dy = q[1] - p[1], L2 = dx * dx + dy * dy;
  const t = L2 > 0 ? clamp(((c[0] - p[0]) * dx + (c[1] - p[1]) * dy) / L2, 0, 1) : 0;
  return Math.hypot(c[0] - p[0] - t * dx, c[1] - p[1] - t * dy);
}
/** True when the 2R arm (link half-width w) touches a disc obstacle {x, y, r}. */
export function armHitsDiscs(l1, l2, t1, t2, discs, w) {
  const a = Math.cos(t1) * l1, b = Math.sin(t1) * l1, e = [a + l2 * Math.cos(t1 + t2), b + l2 * Math.sin(t1 + t2)];
  for (const o of discs) {
    const c = [o.x, o.y];
    if (segPointDist([0, 0], [a, b], c) < o.r + w || segPointDist([a, b], e, c) < o.r + w) return true;
  }
  return false;
}
/**
 * Label the connected components of the free cells of an N×N grid on the torus (4-neighbours, edges wrap).
 * free[i + N j] = 1 for free cells. Returns {lab (Int16, −1 for blocked), count, sizes}. Iterative flood fill.
 */
export function floodTorus(free, N) {
  const lab = new Int16Array(N * N).fill(-1), sizes = []; const stack = [];
  for (let s = 0; s < N * N; s++) {
    if (!free[s] || lab[s] >= 0) continue;
    const id = sizes.length; let n = 0; stack.push(s); lab[s] = id;
    while (stack.length) {
      const c = stack.pop(); n++; const i = c % N, j = (c - i) / N;
      const nb = [((i + 1) % N) + N * j, ((i + N - 1) % N) + N * j, i + N * ((j + 1) % N), i + N * ((j + N - 1) % N)];
      for (const m of nb) if (free[m] && lab[m] < 0) { lab[m] = id; stack.push(m); }
    }
    sizes.push(n);
  }
  return { lab, count: sizes.length, sizes };
}

// ── rotations ─────────────────────────────────────────────────────────────────
/** Rotation matrix of the rotation vector r (axis r/|r|, angle |r|), Rodrigues' formula. */
export function rotFromVec(r) {
  const th = Math.hypot(r[0], r[1], r[2]);
  if (th < 1e-12) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const [x, y, z] = [r[0] / th, r[1] / th, r[2] / th], c = Math.cos(th), s = Math.sin(th), C = 1 - c;
  return [[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]];
}
/** Unit quaternion [w, x, y, z] of the rotation vector r (w ≥ 0 when |r| ≤ π). */
export function quatFromVec(r) {
  const th = Math.hypot(r[0], r[1], r[2]); if (th < 1e-12) return [1, 0, 0, 0];
  const s = Math.sin(th / 2) / th; return [Math.cos(th / 2), r[0] * s, r[1] * s, r[2] * s];
}
/** Rotation matrix straight from a unit quaternion [w, x, y, z]. */
export function rotFromQuat([w, x, y, z]) {
  return [[1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)], [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)], [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)]];
}
export const mulVec = (R, p) => [0, 1, 2].map((i) => R[i][0] * p[0] + R[i][1] * p[1] + R[i][2] * p[2]);

// ── rigid body pinned at points (item 1.1) ────────────────────────────────────
/** Rows of the velocity constraint "point P of the body does not move" for a planar twist (ω, vx, vy). */
export const pinRows2 = (P) => [[-P[1], 1, 0], [P[0], 0, 1]];
/** Same for a spatial twist (ω1, ω2, ω3, v1, v2, v3): v + ω × P = 0. */
export const pinRows3 = (P) => [[0, P[2], -P[1], 1, 0, 0], [-P[2], 0, P[0], 0, 1, 0], [P[1], -P[0], 0, 0, 0, 1]];
/** Degrees of freedom left after pinning the points: dim of the twists that keep all of them still. */
export function dofAfterPins(M, pts, dim) {
  const n = dim === 2 ? 3 : 6, rows = [];
  for (const P of pts) rows.push(...(dim === 2 ? pinRows2(P) : pinRows3(P)));
  return n - (rows.length ? M.rank(rows, 1e-9) : 0);
}
/** 4×4 matrix exp of the twist (ω, v) scaled by 1. */
export function twistExp(M, xi) {
  const [a, b, c, x, y, z] = xi;
  return M.expm([[0, -c, b, x], [c, 0, -a, y], [-b, a, 0, z], [0, 0, 0, 0]]);
}

// ── planar mechanisms (item 1.2) ──────────────────────────────────────────────
// A mechanism is a set of rigid links (link 0 is the ground) joined by revolute (R) or prismatic (P) joints. The
// state q holds (x, y, θ) of every moving link; local coordinates of a link equal the world coordinates of the
// assembled mechanism (all poses start at zero), so the specification is simply a drawing.
export function buildMech(spec) {
  const N = spec.links.length, n = 3 * (N - 1);
  const pose = (q, i) => (i === 0 ? [0, 0, 0] : [q[3 * (i - 1)], q[3 * (i - 1) + 1], q[3 * (i - 1) + 2]]);
  const pos = (q, i, p) => { const [x, y, t] = pose(q, i), c = Math.cos(t), s = Math.sin(t); return [x + c * p[0] - s * p[1], y + s * p[0] + c * p[1]]; };
  const C = (q) => {
    const out = [];
    for (const j of spec.joints) {
      const pa = pos(q, j.a, j.p), pb = pos(q, j.b, j.p);
      if (j.type === 'R') out.push(pa[0] - pb[0], pa[1] - pb[1]);
      else {
        const ta = pose(q, j.a)[2], tb = pose(q, j.b)[2], nx = -j.dir[1], ny = j.dir[0], c = Math.cos(ta), s = Math.sin(ta);
        const Nx = c * nx - s * ny, Ny = s * nx + c * ny;
        out.push(tb - ta, Nx * (pb[0] - pa[0]) + Ny * (pb[1] - pa[1]));
      }
    }
    return out;
  };
  const jac = (F, q, h = 1e-6) => {
    const f0 = F(q), m = f0.length, J = Array.from({ length: m }, () => new Array(q.length).fill(0));
    for (let k = 0; k < q.length; k++) { const qa = q.slice(), qb = q.slice(); qa[k] += h; qb[k] -= h; const fa = F(qa), fb = F(qb); for (let i = 0; i < m; i++) J[i][k] = (fa[i] - fb[i]) / (2 * h); }
    return J;
  };
  const Jc = (q) => jac(C, q);
  /** Number of equations and the true local mobility n − rank(J). */
  const mobility = (q, M) => { const J = Jc(q); return { n, m: J.length, rank: M.rank(J, 1e-6), dof: n - M.rank(J, 1e-6) }; };
  /** Move the point p of link i toward target t along the constraint manifold (a few damped steps). */
  const drag = (q, i, p, t, M) => {
    q = q.slice();
    for (let it = 0; it < 6; it++) {
      const J = Jc(q), Nsp = M.nullspace(J, 1e-6); if (!Nsp.length) break;
      const here = pos(q, i, p), e = [t[0] - here[0], t[1] - here[1]];
      const Jt = jac((qq) => pos(qq, i, p), q);                       // 2 × n
      const A = Jt.map((r) => Nsp.map((nv) => r.reduce((s, x, k) => s + x * nv[k], 0)));     // 2 × d
      const AtA = M.matMul(M.transpose(A), A).map((r, a) => r.map((x, b) => x + (a === b ? 1e-4 : 0)));
      const y = M.solve(AtA, M.matVec(M.transpose(A), e));
      let dq = q.map((_, k) => Nsp.reduce((s, nv, a) => s + nv[k] * y[a], 0)); const nr = Math.hypot(...dq);
      if (nr > 0.25) dq = dq.map((x) => (x * 0.25) / nr);
      q = q.map((x, k) => x + dq[k]);
      for (let c = 0; c < 4; c++) { const Cq = C(q); if (Math.hypot(...Cq) < 1e-11) break; const corr = M.lstsq(Jc(q), Cq, 1e-8); q = q.map((x, k) => x - corr[k]); }
      if (Math.hypot(e[0], e[1]) < 1e-5) break;
    }
    return q;
  };
  return { spec, N, n, pose, pos, C, Jc, mobility, drag, q0: new Array(n).fill(0) };
}

/** Grübler / Chebyshev–Kutzbach count for the planar case (every joint has one freedom): 3(N − 1 − J) + J. */
export const gruebler = (N, J, sumF = J, lambda = 3) => lambda * (N - 1 - J) + sumF;

const hexCol = ['accent', 'orange', 'green', 'purple', 'teal', 'pink'];
export const linkColor = (i) => hexCol[(i - 1 + hexCol.length) % hexCol.length];

/** Planar mechanism presets: world coordinates of the joints in the assembled pose. */
export const MECHS = {
  four: {
    name: 'four-bar', note: 'four bars, four pins',
    links: ['ground', 'crank', 'coupler', 'rocker'],
    joints: [{ type: 'R', a: 0, b: 1, p: [0, 0] }, { type: 'R', a: 1, b: 2, p: [1, 1.5] }, { type: 'R', a: 2, b: 3, p: [3.6, 2.2] }, { type: 'R', a: 3, b: 0, p: [4, 0] }],
    drive: [{ link: 1, p: [1, 1.5] }], view: [-1.5, 6.5, -2.5, 4.5],
  },
  five: {
    name: 'five-bar', note: 'five bars, five pins',
    links: ['ground', 'a', 'b', 'c', 'd'],
    joints: [{ type: 'R', a: 0, b: 1, p: [0, 0] }, { type: 'R', a: 1, b: 2, p: [0.2, 1.8] }, { type: 'R', a: 2, b: 3, p: [2.2, 3] }, { type: 'R', a: 3, b: 4, p: [4.2, 1.7] }, { type: 'R', a: 4, b: 0, p: [4, 0] }],
    drive: [{ link: 1, p: [0.2, 1.8] }, { link: 4, p: [4.2, 1.7] }], view: [-1.5, 6.5, -2.5, 4.5],
  },
  slider: {
    name: 'slider-crank', note: 'three pins and one sliding joint',
    links: ['ground', 'crank', 'rod', 'slider'],
    joints: [{ type: 'R', a: 0, b: 1, p: [0, 0] }, { type: 'R', a: 1, b: 2, p: [0.9, 0.9] }, { type: 'R', a: 2, b: 3, p: [3.6, 0] }, { type: 'P', a: 0, b: 3, p: [3.6, 0], dir: [1, 0] }],
    drive: [{ link: 1, p: [0.9, 0.9] }], view: [-1.8, 6.2, -2.4, 3.4],
  },
  truss: {
    name: 'triangle', note: 'three bars, three pins: a truss',
    links: ['ground', 'a', 'b'],
    joints: [{ type: 'R', a: 0, b: 1, p: [0, 0] }, { type: 'R', a: 1, b: 2, p: [1.8, 2.4] }, { type: 'R', a: 2, b: 0, p: [4, 0] }],
    drive: [{ link: 1, p: [1.8, 2.4] }], view: [-1.5, 5.5, -1.5, 3.8],
  },
  watt: {
    name: 'Watt six-bar', note: 'six links, seven pins',
    // ground = binary link B1; T1 and T2 are ternary and joined to each other
    links: ['B1 (ground)', 'T1', 'T2', 'B3', 'B2', 'B4'],
    joints: [
      { type: 'R', a: 1, b: 2, p: [0, 0] }, { type: 'R', a: 1, b: 0, p: [-1.6, -1.2] }, { type: 'R', a: 1, b: 4, p: [-1.4, 1.5] },
      { type: 'R', a: 2, b: 3, p: [1.6, -1.2] }, { type: 'R', a: 2, b: 5, p: [1.5, 1.4] }, { type: 'R', a: 0, b: 3, p: [0, -2.6] }, { type: 'R', a: 4, b: 5, p: [0, 3] },
    ],
    drive: [{ link: 1, p: [-1.4, 1.5] }], view: [-4, 4, -3.6, 4.2],
  },
  para: {
    name: 'doubled parallelogram', note: 'five bars, six pins — but it moves',
    links: ['ground', 'left', 'coupler', 'right', 'middle'],
    joints: [
      { type: 'R', a: 0, b: 1, p: [0, 0] }, { type: 'R', a: 0, b: 3, p: [4, 0] }, { type: 'R', a: 0, b: 4, p: [2, 0] },
      { type: 'R', a: 1, b: 2, p: [0, 1.8] }, { type: 'R', a: 3, b: 2, p: [4, 1.8] }, { type: 'R', a: 4, b: 2, p: [2, 1.8] },
    ],
    drive: [{ link: 1, p: [0, 1.8] }], view: [-2, 6, -1.6, 4.2],
  },
};

/** Draw outline points of a link: the joint points it carries, in order around their centroid (chain order for 2). */
export function linkOutline(spec, i) {
  const pts = []; for (const j of spec.joints) { if (j.a === i || j.b === i) pts.push(j.p); }
  const uniq = []; for (const p of pts) if (!uniq.some((u) => Math.hypot(u[0] - p[0], u[1] - p[1]) < 1e-9)) uniq.push(p);
  return uniq;
}
