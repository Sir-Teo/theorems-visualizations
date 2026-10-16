// Fluid Dynamics — Chapter 3 shared helpers (plain named exports)
export * from './ch02.shared.js';

export const TAU = 2 * Math.PI;

/** Velocity at (px, py) induced by 2D Lamb-Oseen vortices V = {x, y, G} (arrays); core a2 = a^2 (a2 = 0: point vortices).
 *  `skip` is the index of a vortex to leave out (its own field). */
export function vortexVel(px, py, V, a2, skip = -1) {
  let u = 0, w = 0;
  for (let j = 0; j < V.G.length; j++) {
    if (j === skip) continue;
    const dx = px - V.x[j], dy = py - V.y[j], r2 = dx * dx + dy * dy + 1e-14;
    const k = (V.G[j] / (TAU * r2)) * (a2 > 0 ? 1 - Math.exp(-r2 / a2) : 1);
    u -= k * dy; w += k * dx;
  }
  return [u, w];
}

/** One RK4 step of vortices V (self-advecting, mutual induction) and passive points P = {X, Y, n} (typed or plain arrays). */
export function rk4Vortices(V, P, dt, a2) {
  const nv = V.G.length, n = P ? P.n : 0;
  const vx0 = Array.from(V.x), vy0 = Array.from(V.y);
  const px0 = n ? Float64Array.from(P.X.subarray ? P.X.subarray(0, n) : P.X.slice(0, n)) : null;
  const py0 = n ? Float64Array.from(P.Y.subarray ? P.Y.subarray(0, n) : P.Y.slice(0, n)) : null;
  const K = [];
  const stage = (vx, vy, px, py) => {
    const W = { x: vx, y: vy, G: V.G }, dv = [], dp = [];
    for (let j = 0; j < nv; j++) dv.push(vortexVel(vx[j], vy[j], W, a2, j));
    for (let i = 0; i < n; i++) dp.push(vortexVel(px[i], py[i], W, a2));
    return { dv, dp };
  };
  const adv = (k, h) => {
    const vx = vx0.map((x, j) => x + h * k.dv[j][0]), vy = vy0.map((y, j) => y + h * k.dv[j][1]);
    const px = n ? px0.map((x, i) => x + h * k.dp[i][0]) : null, py = n ? py0.map((y, i) => y + h * k.dp[i][1]) : null;
    return [vx, vy, px, py];
  };
  K[0] = stage(vx0, vy0, px0, py0);
  K[1] = stage(...adv(K[0], dt / 2));
  K[2] = stage(...adv(K[1], dt / 2));
  K[3] = stage(...adv(K[2], dt));
  for (let j = 0; j < nv; j++) {
    V.x[j] = vx0[j] + (dt / 6) * (K[0].dv[j][0] + 2 * K[1].dv[j][0] + 2 * K[2].dv[j][0] + K[3].dv[j][0]);
    V.y[j] = vy0[j] + (dt / 6) * (K[0].dv[j][1] + 2 * K[1].dv[j][1] + 2 * K[2].dv[j][1] + K[3].dv[j][1]);
  }
  for (let i = 0; i < n; i++) {
    P.X[i] = px0[i] + (dt / 6) * (K[0].dp[i][0] + 2 * K[1].dp[i][0] + 2 * K[2].dp[i][0] + K[3].dp[i][0]);
    P.Y[i] = py0[i] + (dt / 6) * (K[0].dp[i][1] + 2 * K[1].dp[i][1] + 2 * K[2].dp[i][1] + K[3].dp[i][1]);
  }
}

/** Complete elliptic integrals K(m), E(m) (m = k^2) by the arithmetic-geometric mean. */
export function ellKE(m) {
  if (m >= 1) m = 1 - 1e-15;
  let a = 1, b = Math.sqrt(1 - m), c = Math.sqrt(m), s = 0.5 * c * c, p = 0.5;
  for (let i = 0; i < 40 && Math.abs(c) > 1e-16; i++) {
    const an = (a + b) / 2; c = (a - b) / 2; b = Math.sqrt(a * b); a = an; p *= 2; s += p * c * c;
  }
  const K = Math.PI / (2 * a);
  return [K, K * (1 - s)];
}

/** Stokes stream function (per 2 pi... units of circulation G) of a thin vortex ring of radius R0 at height z0, evaluated at (R, z). */
export function ringPsi(R, z, R0, z0, G) {
  const dz = z - z0, d2 = (R + R0) ** 2 + dz * dz, m = (4 * R * R0) / d2;
  if (m <= 0) return 0;
  const [K, E] = ellKE(m), k = Math.sqrt(m);
  return (G / TAU) * Math.sqrt(R * R0) * ((2 / k - k) * K - (2 / k) * E);
}

/** Biot-Savart velocity at p = [x, y, z] of a polyline of 3D points carrying circulation G (exact for straight segments). */
export function biotSavart(pts, closed, G, p) {
  let ux = 0, uy = 0, uz = 0;
  const n = pts.length, m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const r1x = p[0] - a[0], r1y = p[1] - a[1], r1z = p[2] - a[2], r2x = p[0] - b[0], r2y = p[1] - b[1], r2z = p[2] - b[2];
    const cx = r1y * r2z - r1z * r2y, cy = r1z * r2x - r1x * r2z, cz = r1x * r2y - r1y * r2x;
    const c2 = cx * cx + cy * cy + cz * cz;
    if (c2 < 1e-18) continue;
    const l1 = Math.hypot(r1x, r1y, r1z), l2 = Math.hypot(r2x, r2y, r2z);
    const lx = b[0] - a[0], ly = b[1] - a[1], lz = b[2] - a[2];
    const f = (lx * (r1x / l1 - r2x / l2) + ly * (r1y / l1 - r2y / l2) + lz * (r1z / l1 - r2z / l2)) / c2;
    ux += cx * f; uy += cy * f; uz += cz * f;
  }
  const k = G / (4 * Math.PI);
  return [k * ux, k * uy, k * uz];
}

/** The ABC (Arnold-Beltrami-Childress) flow, a steady Euler flow with curl u = u. */
export function abc(p, A = 1, B = Math.sqrt(2 / 3), C = Math.sqrt(1 / 3)) {
  const [x, y, z] = p;
  return [A * Math.sin(z) + C * Math.cos(y), B * Math.sin(x) + A * Math.cos(z), C * Math.sin(y) + B * Math.cos(x)];
}
/** RK4 step of a point p in a steady 3D field f. */
export function rk4p(f, p, dt) {
  const k1 = f(p), q2 = [p[0] + (dt / 2) * k1[0], p[1] + (dt / 2) * k1[1], p[2] + (dt / 2) * k1[2]], k2 = f(q2);
  const q3 = [p[0] + (dt / 2) * k2[0], p[1] + (dt / 2) * k2[1], p[2] + (dt / 2) * k2[2]], k3 = f(q3);
  const q4 = [p[0] + dt * k3[0], p[1] + dt * k3[1], p[2] + dt * k3[2]], k4 = f(q4);
  return [0, 1, 2].map((i) => p[i] + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
