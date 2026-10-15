// Astrophysics & Celestial Mechanics — Chapter 2: helpers shared by ch02.js and ch02-b.js
// Units for the restricted problem: G = 1, total mass 1, separation 1, mean motion 1 (period 2π);
// primary (1 − μ) at (−μ, 0), secondary μ at (1 − μ, 0) in the rotating frame.

export const TAU = 2 * Math.PI, DEG = Math.PI / 180;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
/** One-slot cache: recompute only when the key changes. */
export function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }
/** TeX scientific notation that also handles 0 (use inside $…$). */
export const sci = (v, x, d = 2) => (!isFinite(x) ? '\\infty' : Math.abs(x) < 1e-300 ? '0' : v.sci(x, d));
/** Wrap an angle in degrees to [0, 360). */
export const wrap360 = (d) => ((d % 360) + 360) % 360;
/** Wrap an angle in degrees to [−180, 180). */
export const wrap180 = (d) => ((((d + 180) % 360) + 360) % 360) - 180;

// ── restricted three-body problem ─────────────────────────────────────────────
/** 2Ω = x² + y² + 2(1 − μ)/r₁ + 2μ/r₂ (z-term included through r₁, r₂). Jacobi constant C = 2Ω − v². */
export function omega2(mu, x, y, z = 0) {
  const r1 = Math.sqrt((x + mu) ** 2 + y * y + z * z), r2 = Math.sqrt((x - 1 + mu) ** 2 + y * y + z * z);
  return x * x + y * y + (2 * (1 - mu)) / r1 + (2 * mu) / r2;
}
/** Jacobi constant of a rotating-frame state [x, y, z, vx, vy, vz] (or planar [x, y, vx, vy]). */
export function jacobi(mu, s) {
  if (s.length === 4) return omega2(mu, s[0], s[1]) - s[2] * s[2] - s[3] * s[3];
  return omega2(mu, s[0], s[1], s[2]) - s[3] * s[3] - s[4] * s[4] - s[5] * s[5];
}
/** The five Lagrange points: {L1: [x, y], …, C: {L1: C_J, …}}. */
export function lagrange(mu) {
  const f = (x) => { const a = x + mu, b = x - 1 + mu; return x - ((1 - mu) * a) / Math.abs(a) ** 3 - (mu * b) / Math.abs(b) ** 3; };
  const bis = (lo, hi) => { let flo = f(lo); for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2, fm = f(m); if (fm * flo <= 0) hi = m; else { lo = m; flo = fm; } } return (lo + hi) / 2; };
  const eps = 1e-9;
  const L1 = [bis(-mu + eps, 1 - mu - eps), 0], L2 = [bis(1 - mu + eps, 2), 0], L3 = [bis(-2, -mu - eps), 0];
  const L4 = [0.5 - mu, Math.sqrt(3) / 2], L5 = [0.5 - mu, -Math.sqrt(3) / 2];
  const P = { L1, L2, L3, L4, L5 }, C = {};
  for (const k in P) C[k] = omega2(mu, P[k][0], P[k][1]);
  return { ...P, C };
}
/**
 * Integrate the (spatial) circular restricted problem in the rotating frame with RK4 and a step adapted to the distances
 * from both masses: h = eta·min(1, √(r₁³/(1−μ)), √(r₂³/μ)), capped by hmax.
 * s0 = [x, y, z, vx, vy, vz]. Options: T (may be negative), eta (0.02), hmax (0.05), every (record spacing in time, default 0 = every step),
 * maxSteps, stop(s, t) → true to stop. Returns {t: [], s: [[…6]], stop}.
 */
export function cr3bp(mu, s0, o = {}) {
  const T = o.T ?? 10, dir = T < 0 ? -1 : 1, eta = o.eta ?? 0.02, hmax = o.hmax ?? 0.05, every = o.every ?? 0, maxN = o.maxSteps ?? 200000, m1 = 1 - mu;
  let x = s0[0], y = s0[1], z = s0[2], u = s0[3], w = s0[4], q = s0[5], t = 0, lastRec = 0, stop = 'time';
  const out = { t: [0], s: [[x, y, z, u, w, q]] };
  const acc = (X, Y, Z, U, W, A) => {
    const dx1 = X + mu, dx2 = X - 1 + mu, yz = Y * Y + Z * Z;
    const r1s = dx1 * dx1 + yz, r2s = dx2 * dx2 + yz, k1 = m1 / (r1s * Math.sqrt(r1s)), k2 = mu / (r2s * Math.sqrt(r2s));
    A[0] = X - k1 * dx1 - k2 * dx2 + 2 * W; A[1] = Y - (k1 + k2) * Y - 2 * U; A[2] = -(k1 + k2) * Z;
  };
  const a1 = [0, 0, 0], a2 = [0, 0, 0], a3 = [0, 0, 0], a4 = [0, 0, 0];
  let n = 0;
  for (; n < maxN; n++) {
    const r1 = Math.sqrt((x + mu) ** 2 + y * y + z * z), r2 = Math.sqrt((x - 1 + mu) ** 2 + y * y + z * z);
    let h = eta * Math.min(1, Math.sqrt((r1 * r1 * r1) / m1), Math.sqrt((r2 * r2 * r2) / Math.max(mu, 1e-300)));
    if (h > hmax) h = hmax;
    const left = Math.abs(T) - Math.abs(t);
    if (left <= 1e-12) break;
    if (h > left) h = left;
    h *= dir;
    acc(x, y, z, u, w, a1);
    const x2 = x + 0.5 * h * u, y2 = y + 0.5 * h * w, z2 = z + 0.5 * h * q, u2 = u + 0.5 * h * a1[0], w2 = w + 0.5 * h * a1[1], q2 = q + 0.5 * h * a1[2];
    acc(x2, y2, z2, u2, w2, a2);
    const x3 = x + 0.5 * h * u2, y3 = y + 0.5 * h * w2, z3 = z + 0.5 * h * q2, u3 = u + 0.5 * h * a2[0], w3 = w + 0.5 * h * a2[1], q3 = q + 0.5 * h * a2[2];
    acc(x3, y3, z3, u3, w3, a3);
    const x4 = x + h * u3, y4 = y + h * w3, z4 = z + h * q3, u4 = u + h * a3[0], w4 = w + h * a3[1], q4 = q + h * a3[2];
    acc(x4, y4, z4, u4, w4, a4);
    x += (h / 6) * (u + 2 * u2 + 2 * u3 + u4); y += (h / 6) * (w + 2 * w2 + 2 * w3 + w4); z += (h / 6) * (q + 2 * q2 + 2 * q3 + q4);
    u += (h / 6) * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]); w += (h / 6) * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]); q += (h / 6) * (a1[2] + 2 * a2[2] + 2 * a3[2] + a4[2]);
    t += h;
    if (!every || Math.abs(t - lastRec) >= every) { out.t.push(t); out.s.push([x, y, z, u, w, q]); lastRec = t; }
    if (o.stop && o.stop([x, y, z, u, w, q], t)) { stop = 'stop'; break; }
  }
  if (n >= maxN) stop = 'steps';
  if (out.t[out.t.length - 1] !== t) { out.t.push(t); out.s.push([x, y, z, u, w, q]); }
  out.stop = stop; out.steps = n;
  return out;
}
/** Rotating-frame state → inertial (barycentric) state at time t (frame angle = t). */
export function toInertial(s, t) {
  const c = Math.cos(t), sn = Math.sin(t), vx = s[3] - s[1], vy = s[4] + s[0];
  return [c * s[0] - sn * s[1], sn * s[0] + c * s[1], s[2], c * vx - sn * vy, sn * vx + c * vy, s[5]];
}
/** Inertial (barycentric) state at time t → rotating-frame state. */
export function toRotating(S, t) {
  const c = Math.cos(t), sn = Math.sin(t);
  const x = c * S[0] + sn * S[1], y = -sn * S[0] + c * S[1], vx = c * S[3] + sn * S[4], vy = -sn * S[3] + c * S[4];
  return [x, y, S[2], vx + y, vy - x, S[5]];
}
/**
 * Osculating elements of a state relative to a centre of gravitational parameter gm, from relative position r and velocity v (3-vectors).
 * Returns {a, e, i, Om, w, varpi, M, lambda, nu} (radians; a < 0 for hyperbolic).
 */
export function elements(gm, r, v) {
  const rn = Math.hypot(r[0], r[1], r[2]), v2 = v[0] * v[0] + v[1] * v[1] + v[2] * v[2], rv = r[0] * v[0] + r[1] * v[1] + r[2] * v[2];
  const hx = r[1] * v[2] - r[2] * v[1], hy = r[2] * v[0] - r[0] * v[2], hz = r[0] * v[1] - r[1] * v[0], hn = Math.hypot(hx, hy, hz);
  const a = 1 / (2 / rn - v2 / gm);
  const ex = (v2 / gm - 1 / rn) * r[0] - (rv / gm) * v[0], ey = (v2 / gm - 1 / rn) * r[1] - (rv / gm) * v[1], ez = (v2 / gm - 1 / rn) * r[2] - (rv / gm) * v[2];
  const e = Math.hypot(ex, ey, ez), inc = Math.acos(clamp(hz / hn, -1, 1));
  const Om = Math.atan2(hx, -hy);
  // longitude of pericentre ϖ = Ω + ω, measured in the reference plane (planar-friendly)
  const varpi = Math.atan2(ey, ex);
  const nx = -hy, ny = hx, nn = Math.hypot(nx, ny);
  let w = 0;
  if (nn > 1e-12 && e > 1e-12) { w = Math.acos(clamp((nx * ex + ny * ey) / (nn * e), -1, 1)); if (ez < 0) w = TAU - w; }
  let nu = 0;
  if (e > 1e-12) { nu = Math.acos(clamp((ex * r[0] + ey * r[1] + ez * r[2]) / (e * rn), -1, 1)); if (rv < 0) nu = TAU - nu; }
  let M = NaN;
  if (e < 1) { const E = 2 * Math.atan2(Math.sqrt(1 - e) * Math.sin(nu / 2), Math.sqrt(1 + e) * Math.cos(nu / 2)); M = E - e * Math.sin(E); }
  const lambda = Math.atan2(r[1], r[0]) - nu + (isFinite(M) ? M : 0); // ϖ + M for near-planar orbits
  return { a, e, i: inc, Om, w, varpi, M, lambda, nu };
}
/** Heliocentric osculating elements (centre = primary, gm = 1 − μ) of a rotating-frame state at time t. */
export function helio(mu, s, t = 0) {
  const r = [s[0] + mu, s[1], s[2]], v = [s[3] - s[1], s[4] + s[0] + mu, s[5]];
  const c = Math.cos(t), sn = Math.sin(t);
  const R = [c * r[0] - sn * r[1], sn * r[0] + c * r[1], r[2]], V = [c * v[0] - sn * v[1], sn * v[0] + c * v[1], v[2]];
  return elements(1 - mu, R, V);
}
/** Heliocentric state from elements (gm, a, e, i, Ω, ω, mean anomaly M); returns [x, y, z, vx, vy, vz]. */
export function fromElements(gm, a, e, inc, Om, w, M) {
  let E = e < 0.8 ? M : Math.PI;
  for (let k = 0; k < 60; k++) { const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-14) break; }
  const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  const p = a * (1 - e * e), r = p / (1 + e * Math.cos(nu)), k = Math.sqrt(gm / p);
  const X = r * Math.cos(nu), Y = r * Math.sin(nu), VX = -k * Math.sin(nu), VY = k * (e + Math.cos(nu));
  const cO = Math.cos(Om), sO = Math.sin(Om), ci = Math.cos(inc), si = Math.sin(inc), cw = Math.cos(w), sw = Math.sin(w);
  const P = [cO * cw - sO * sw * ci, sO * cw + cO * sw * ci, sw * si], Q = [-cO * sw - sO * cw * ci, -sO * sw + cO * cw * ci, cw * si];
  return [X * P[0] + Y * Q[0], X * P[1] + Y * Q[1], X * P[2] + Y * Q[2], VX * P[0] + VY * Q[0], VX * P[1] + VY * Q[1], VX * P[2] + VY * Q[2]];
}
/** Heliocentric state (relative to the primary, inertial axes aligned with the rotating frame at t) → rotating barycentric state at time t. */
export function helioToRotating(mu, H, t = 0) {
  const c = Math.cos(t), sn = Math.sin(t);
  // inertial barycentric = heliocentric + Sun's barycentric position/velocity
  const S = [H[0] - mu * c, H[1] - mu * sn, H[2], H[3] + mu * sn, H[4] - mu * c, H[5]];
  return toRotating(S, t);
}

// ── Kepler drift (f and g functions) for symplectic maps ──────────────────────
/** Advance a bound two-body state (x, y, vx, vy) about gm by dt in place on array s at offset o (planar). Returns false if unbound. */
export function keplerDrift(gm, s, o, dt) {
  const x = s[o], y = s[o + 1], vx = s[o + 2], vy = s[o + 3];
  const r0 = Math.sqrt(x * x + y * y), v2 = vx * vx + vy * vy, a = 1 / (2 / r0 - v2 / gm);
  if (!(a > 0)) return false;
  const n = Math.sqrt(gm / (a * a * a)), ec = 1 - r0 / a, es = (x * vx + y * vy) / Math.sqrt(gm * a);
  const dM = n * dt;
  let dE = dM;
  for (let k = 0; k < 30; k++) {
    const c = Math.cos(dE), sn = Math.sin(dE), F = dE - ec * sn + es * (1 - c) - dM, Fp = 1 - ec * c + es * sn;
    const d = F / Fp; dE -= d; if (Math.abs(d) < 1e-13) break;
  }
  const c = Math.cos(dE), sn = Math.sin(dE), r = a * (1 - ec * c + es * sn);
  const f = 1 - (a / r0) * (1 - c), g = dt - (dE - sn) / n, fd = (-a * a * n * sn) / (r * r0), gd = 1 - (a / r) * (1 - c);
  s[o] = f * x + g * vx; s[o + 1] = f * y + g * vy; s[o + 2] = fd * x + gd * vx; s[o + 3] = fd * y + gd * vy;
  return true;
}
/** Eccentric anomaly from mean anomaly. */
export function kepE(M, e) {
  M = ((M % TAU) + TAU) % TAU;
  let E = e < 0.8 ? M : Math.PI;
  for (let k = 0; k < 60; k++) { const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-14) break; }
  return E;
}
/**
 * Test particles in the planar elliptic restricted problem (heliocentric Wisdom–Holman map: Kepler drift about the Sun,
 * kicks from the planet's direct and indirect terms). Planet: mass ratio mp (to the Sun, GM_sun = gm), fixed ellipse (ap, ep, ϖ = 0),
 * mean anomaly np·t. State array P = [x, y, vx, vy, …] per particle. Advances nSteps of size dt from time t0; returns the new time.
 * onStep(t) is called after each step (optional). Particles flagged dead[i] are skipped.
 */
export function ertbpSteps(P, dead, gm, mp, ap, ep, t0, dt, nSteps, onStep) {
  const np = Math.sqrt((gm * (1 + mp)) / (ap * ap * ap)), N = P.length / 4, gp = gm * mp;
  const planet = (t) => {
    const E = kepE(np * t, ep), x = ap * (Math.cos(E) - ep), y = ap * Math.sqrt(1 - ep * ep) * Math.sin(E);
    return [x, y];
  };
  let t = t0;
  const kick = (tt, h) => {
    const [X, Y] = planet(tt), R3 = Math.pow(X * X + Y * Y, 1.5), ix = -gp * X / R3, iy = -gp * Y / R3;
    for (let i = 0; i < N; i++) {
      if (dead[i]) continue;
      const o = 4 * i, dx = X - P[o], dy = Y - P[o + 1], d2 = dx * dx + dy * dy, d3 = d2 * Math.sqrt(d2);
      P[o + 2] += h * (gp * dx / d3 + ix); P[o + 3] += h * (gp * dy / d3 + iy);
    }
  };
  for (let k = 0; k < nSteps; k++) {
    kick(t, dt / 2);
    for (let i = 0; i < N; i++) { if (dead[i]) continue; if (!keplerDrift(gm, P, 4 * i, dt)) dead[i] = 2; }
    t += dt;
    kick(t, dt / 2);
    if (onStep) onStep(t);
  }
  return t;
}
/** Planar osculating a, e, ϖ, λ of particle i (heliocentric, gm). */
export function pEl(P, i, gm) {
  const o = 4 * i, x = P[o], y = P[o + 1], vx = P[o + 2], vy = P[o + 3];
  const r = Math.hypot(x, y), v2 = vx * vx + vy * vy, rv = x * vx + y * vy, a = 1 / (2 / r - v2 / gm);
  const ex = (v2 / gm - 1 / r) * x - (rv / gm) * vx, ey = (v2 / gm - 1 / r) * y - (rv / gm) * vy, e = Math.hypot(ex, ey);
  return { a, e, varpi: Math.atan2(ey, ex), r };
}
