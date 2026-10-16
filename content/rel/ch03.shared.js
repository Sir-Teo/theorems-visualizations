// Shared helpers for Special & General Relativity — Chapter 3 (units c = 1; events are (t, x), drawn with x across and t up).
export * from './ch02.shared.js';
import { P } from './ch02.shared.js';

/** Minkowski product of two (t, x) pairs, signature (+, −). */
export const mdot = (a, b) => a[0] * b[0] - a[1] * b[1];

/** Draw the invariant curve through the event (t0, x0): the hyperbola of constant interval, or the light lines when null. */
export function invCurve(s, t0, x0, st = {}) {
  const s2 = t0 * t0 - x0 * x0;
  const R = 30, o = { color: 'green', width: 1.4, alpha: 0.75, dash: [5, 4], ...st };
  if (Math.abs(s2) < 1e-6) { s.line(-R, -R, R, R, o); s.line(-R, R, R, -R, o); return; }
  if (s2 > 0) { const k = Math.sqrt(s2), sg = t0 >= 0 ? 1 : -1; s.curve((u) => P(sg * k * Math.cosh(u), k * Math.sinh(u)), -4, 4, o); }
  else { const k = Math.sqrt(-s2), sg = x0 >= 0 ? 1 : -1; s.curve((u) => P(k * Math.sinh(u), sg * k * Math.cosh(u)), -4, 4, o); }
}

/** Oscillating one-dimensional motion v(t) = V sin(w t) from rest at x = 0: everything about its worldline, four-velocity and four-acceleration. */
export function osc(V, w) {
  const g = (t) => 1 / Math.sqrt(1 - (V * Math.sin(w * t)) ** 2);
  const vel = (t) => V * Math.sin(w * t);
  const acc = (t) => V * w * Math.cos(w * t); // lab-frame dv/dt
  return {
    x: (t) => (V * (1 - Math.cos(w * t))) / w, vel, acc, gam: g,
    u: (t) => [g(t), g(t) * vel(t)],
    a4: (t) => [g(t) ** 4 * vel(t) * acc(t), g(t) ** 4 * acc(t)], // du/dτ as (t, x)
    alpha: (t) => g(t) ** 3 * acc(t), // proper acceleration (signed)
    /** table of proper time τ(t) on [0, T] with n steps (trapezoid on dτ/dt = 1/γ) */
    tau(T, n = 600) { const a = [0]; for (let i = 1; i <= n; i++) { const t0 = ((i - 1) * T) / n, t1 = (i * T) / n; a.push(a[i - 1] + ((1 / g(t0) + 1 / g(t1)) / 2) * (T / n)); } return a; },
  };
}

/** Comoving-frame gap between two ships with equal acceleration (rear: x = √(ρ²+t²), front: rear + L), at the instant the rear ship has rapidity eta.
 *  Returns the proper distance in the common instantaneous rest frame between the rear event and the front event simultaneous with it there. */
export function equalAccelGap(rho, L, eta) {
  const b = Math.tanh(eta), g = Math.cosh(eta);
  if (Math.abs(b) < 1e-12) return { Lp: L, tB: 0, xB: rho + L };
  let hi = (b * (rho + L)) / (1 - b) + 1, lo = -1;
  const f = (t) => t - b * (Math.sqrt(rho * rho + t * t) + L);
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m; }
  const tB = (lo + hi) / 2, xB = Math.sqrt(rho * rho + tB * tB) + L;
  return { Lp: g * (xB - b * tB) - rho, tB, xB };
}

/** Fermi–Walker transport of a gyroscope round a circle of radius 1 at speed beta (lab frame, c = 1).
 *  Returns the unwrapped angle (rad, relative to the lab x-axis) of the gyroscope's rest-frame spin at n+1 equally spaced phases of one lap. */
export function thomasTable(beta, n = 360, sub = 6) {
  const g = 1 / Math.sqrt(1 - beta * beta), w = beta, N = n * sub, dt = (2 * Math.PI) / w / N;
  const vel = (t) => [-beta * Math.sin(w * t), beta * Math.cos(w * t)], acc = (t) => [-beta * w * Math.cos(w * t), -beta * w * Math.sin(w * t)];
  // initial rest-frame spin along +x (the velocity is along +y, so the spin is transverse to the motion)
  let S = [0, 1, 0]; // lab 4-spin (S0, Sx, Sy): rest-frame (1,0) boosted along +y leaves it unchanged
  const F = (t, S) => { const A = acc(t), V = vel(t), k = g * g * (A[0] * S[1] + A[1] * S[2]); return [k, k * V[0], k * V[1]]; };
  const rest = (t, S) => { const V = vel(t), nn = [V[0] / beta, V[1] / beta], sn = S[1] * nn[0] + S[2] * nn[1]; return [S[1] + (g - 1) * sn * nn[0] - g * S[0] * V[0], S[2] + (g - 1) * sn * nn[1] - g * S[0] * V[1]]; };
  let t = 0, prev = 0, ang = 0, norm = 1;
  const out = [0];
  for (let i = 1; i <= N; i++) {
    const k1 = F(t, S), k2 = F(t + dt / 2, S.map((x, j) => x + (dt / 2) * k1[j])), k3 = F(t + dt / 2, S.map((x, j) => x + (dt / 2) * k2[j])), k4 = F(t + dt, S.map((x, j) => x + dt * k3[j]));
    S = S.map((x, j) => x + (dt / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])); t += dt;
    if (i % sub === 0) {
      const s = rest(t, S); let a = Math.atan2(s[1], s[0]); let d = a - prev; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      ang += d; prev = a; out.push(ang); norm = Math.hypot(s[0], s[1]);
    }
  }
  out.norm = norm;
  return out;
}
