// Solid Mechanics & Structures — Chapter 2: helpers shared by ch02.js and ch02-b.js (plain named exports).
//
//   oblique-projection boxes (drawBox, P3), TeX matrix text, and a small banded Q4 plane-stress finite-element solver
//   (plateFE) used for the Navier–Cauchy item. Everything here is computed, nothing is tabulated.

export const num = (x, d = 1) => { const s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d); return s === '-0' || /^-0\.0*$/.test(s) ? s.slice(1) : s; };
/** TeX pmatrix from rows of numbers (formatted by f). */
export const pmat = (rows, f = (x) => num(x, 1)) => String.raw`\begin{pmatrix}${rows.map((r) => r.map(f).join(' & ')).join(String.raw` \\ `)}\end{pmatrix}`;

// ── oblique ("cabinet") projection: x to the right, y up, z toward the viewer drawn down and to the left ─────────────
export const K3 = { cx: 0.36, cy: 0.27 };
export const P3 = (p, o = [0, 0]) => [o[0] + p[0] - K3.cx * p[2], o[1] + p[1] - K3.cy * p[2]];
/** Project a 3D vector (direction) with the same map (no offset). */
export const D3 = (d) => [d[0] - K3.cx * d[2], d[1] - K3.cy * d[2]];

/**
 * Draw a box with half-sizes h = [hx, hy, hz] centred at o (stage coordinates). Visible faces: front (z+), right (x+), top (y+).
 * Hidden edges are dashed. opts: color (edge), fill (colour name), alpha (fill alpha of the front face), width, hidden (draw back edges).
 */
export function drawBox(v, s, h, o = [0, 0], opts = {}) {
  const [hx, hy, hz] = h, { color = 'ink', fill = 'accent', alpha = 0.16, width = 1.6, hidden = true } = opts;
  const P = (x, y, z) => P3([x, y, z], o);
  const front = [P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz)];
  const right = [P(hx, -hy, hz), P(hx, -hy, -hz), P(hx, hy, -hz), P(hx, hy, hz)];
  const top = [P(-hx, hy, hz), P(hx, hy, hz), P(hx, hy, -hz), P(-hx, hy, -hz)];
  if (hidden) {
    const b0 = P(-hx, -hy, -hz), b1 = P(hx, -hy, -hz), b3 = P(-hx, hy, -hz);
    s.path([b3, b0, b1], { color: 'muted', width: 1, dash: [4, 3], alpha: 0.7 });
    s.path([b0, P(-hx, -hy, hz)], { color: 'muted', width: 1, dash: [4, 3], alpha: 0.7 });
  }
  s.path(top, { close: true, color, width, fill, fillAlpha: alpha * 1.8 });
  s.path(right, { close: true, color, width, fill, fillAlpha: alpha * 1.2 });
  s.path(front, { close: true, color, width, fill, fillAlpha: alpha });
  return { P, front, right, top };
}

// ── Q4 plane-stress finite elements on a rectangle (banded Cholesky); used for the Navier–Cauchy item ──────────────
/**
 * Rectangle W × H, nx × ny bilinear quadrilaterals, thickness 1, plane stress, Young's modulus E, Poisson ratio nu. Left edge clamped.
 * Node (i, j) has index i*(ny+1) + j. Returns {solve(load), ...}: solve({px, py, bx, by}) takes a uniform traction (px, py) on the right
 * edge (force per unit area) and a body force (bx, by) per unit volume, and returns displacements u, nodal arrays, element von Mises
 * stresses and the reaction force on the clamp.
 */
export function plateFE({ W = 2, H = 1, nx = 24, ny = 12, E = 1, nu = 0.3 } = {}) {
  const dx = W / nx, dy = H / ny, nn = (nx + 1) * (ny + 1), nd = 2 * nn, id = (i, j) => i * (ny + 1) + j;
  const c0 = E / (1 - nu * nu), D = [[c0, c0 * nu, 0], [c0 * nu, c0, 0], [0, 0, (c0 * (1 - nu)) / 2]];
  const gp = [-1 / Math.sqrt(3), 1 / Math.sqrt(3)];
  const Bat = (xi, et) => {
    const dNx = [-(1 - et) / 4, (1 - et) / 4, (1 + et) / 4, -(1 + et) / 4].map((q) => (q * 2) / dx);
    const dNy = [-(1 - xi) / 4, -(1 + xi) / 4, (1 + xi) / 4, (1 - xi) / 4].map((q) => (q * 2) / dy);
    const B = [new Array(8).fill(0), new Array(8).fill(0), new Array(8).fill(0)];
    for (let a = 0; a < 4; a++) { B[0][2 * a] = dNx[a]; B[1][2 * a + 1] = dNy[a]; B[2][2 * a] = dNy[a]; B[2][2 * a + 1] = dNx[a]; }
    return B;
  };
  const Ke = Array.from({ length: 8 }, () => new Array(8).fill(0)), detJ = (dx * dy) / 4;
  for (const xi of gp) for (const et of gp) {
    const B = Bat(xi, et), DB = D.map((row) => B[0].map((_, q) => row[0] * B[0][q] + row[1] * B[1][q] + row[2] * B[2][q]));
    for (let p = 0; p < 8; p++) for (let q = 0; q < 8; q++) Ke[p][q] += (B[0][p] * DB[0][q] + B[1][p] * DB[1][q] + B[2][p] * DB[2][q]) * detJ;
  }
  const hb = 2 * (ny + 1) + 3, K = Array.from({ length: nd }, () => new Float64Array(hb + 1));
  const elNodes = (i, j) => [id(i, j), id(i + 1, j), id(i + 1, j + 1), id(i, j + 1)];
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const dofs = elNodes(i, j).flatMap((n) => [2 * n, 2 * n + 1]);
    for (let p = 0; p < 8; p++) for (let q = 0; q < 8; q++) { const r = dofs[p], cc = dofs[q]; if (cc >= r) K[r][cc - r] += Ke[p][q]; }
  }
  const K0 = K.map((r) => Float64Array.from(r)); // unmodified stiffness for the reaction
  let kmax = 0; for (let r = 0; r < nd; r++) kmax = Math.max(kmax, K[r][0]);
  const pen = kmax * 1e9;
  for (let j = 0; j <= ny; j++) { K[2 * id(0, j)][0] += pen; K[2 * id(0, j) + 1][0] += pen; }
  for (let r = 0; r < nd; r++) {
    for (let cc = r; cc <= Math.min(nd - 1, r + hb); cc++) {
      let sm = K[r][cc - r];
      for (let q = Math.max(0, cc - hb); q < r; q++) sm -= K[q][r - q] * K[q][cc - q];
      if (cc === r) K[r][0] = Math.sqrt(sm); else K[r][cc - r] = sm / K[r][0];
    }
  }
  const solveRaw = (F) => {
    const y = new Float64Array(nd), u = new Float64Array(nd);
    for (let r = 0; r < nd; r++) { let sm = F[r]; for (let q = Math.max(0, r - hb); q < r; q++) sm -= K[q][r - q] * y[q]; y[r] = sm / K[r][0]; }
    for (let r = nd - 1; r >= 0; r--) { let sm = y[r]; for (let q = r + 1; q <= Math.min(nd - 1, r + hb); q++) sm -= K[r][q - r] * u[q]; u[r] = sm / K[r][0]; }
    return u;
  };
  const Bc = Bat(0, 0);
  function solve({ px = 0, py = 0, bx = 0, by = 0 }) {
    const F = new Float64Array(nd);
    for (let j = 0; j <= ny; j++) { const w = (j === 0 || j === ny ? 0.5 : 1) * dy; F[2 * id(nx, j)] += px * w; F[2 * id(nx, j) + 1] += py * w; }
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) {
      const a = (i === 0 || i === nx ? 0.5 : 1) * (j === 0 || j === ny ? 0.5 : 1) * dx * dy;
      F[2 * id(i, j)] += bx * a; F[2 * id(i, j) + 1] += by * a;
    }
    const u = solveRaw(F);
    // reaction on the clamp: sum over clamped dofs of (K0 u − F)
    let Rx = 0, Ry = 0;
    for (let j = 0; j <= ny; j++) for (const [c, set] of [[0, 'x'], [1, 'y']]) {
      const r = 2 * id(0, j) + c; let f = 0;
      for (let q = Math.max(0, r - hb); q <= Math.min(nd - 1, r + hb); q++) f += (q >= r ? K0[r][q - r] : K0[q][r - q]) * u[q];
      f -= F[r]; if (set === 'x') Rx += f; else Ry += f;
    }
    const vm = [], sx = [], sy = [], tx = [];
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const dofs = elNodes(i, j).flatMap((n) => [2 * n, 2 * n + 1]);
      const eps = Bc.map((row) => row.reduce((acc, b, q) => acc + b * u[dofs[q]], 0));
      const a = D[0][0] * eps[0] + D[0][1] * eps[1], b = D[1][0] * eps[0] + D[1][1] * eps[1], t = D[2][2] * eps[2];
      sx.push(a); sy.push(b); tx.push(t); vm.push(Math.sqrt(a * a - a * b + b * b + 3 * t * t));
    }
    return { u, vm, sx, sy, tx, Rx, Ry, Fx: px * H + bx * W * H, Fy: py * H + by * W * H };
  }
  return { nx, ny, dx, dy, W, H, id, solve, lambda: (E * nu) / ((1 + nu) * (1 - 2 * nu)), mu: E / (2 * (1 + nu)) };
}
