// Chemical Kinetics — Chapter 4: helpers shared by ch04.js, ch04-b.js and ch04-c.js
// Re-exports chapter 3's helpers (which re-export chapter 2's) and adds a small RK4 solver and formatting helpers.
export * from './ch03.shared.js';

/** Fixed-step RK4 for y' = F(t, y) on [0, T]; n is raised so that the stiffest rate `kmax` has kmax*h <= 0.5. Returns {T, n, ts, ys, at(t)}. */
export function ode(F, y0, T, { kmax = 1, n = 1200 } = {}) {
  n = Math.min(40000, Math.max(n, Math.ceil(2 * T * kmax)));
  const h = T / n, d = y0.length, ys = [y0.slice()];
  let y = y0.slice(), t = 0;
  const add = (a, b, s) => a.map((x, i) => x + s * b[i]);
  for (let i = 0; i < n; i++) {
    const k1 = F(t, y), k2 = F(t + h / 2, add(y, k1, h / 2)), k3 = F(t + h / 2, add(y, k2, h / 2)), k4 = F(t + h, add(y, k3, h));
    y = y.map((x, j) => x + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    t += h; ys.push(y);
  }
  const at = (tt) => {
    const u = Math.min(1, Math.max(0, tt / T)) * n, i = Math.min(n - 1, Math.floor(u)), f = u - i;
    return ys[i].map((x, j) => x + f * (ys[i + 1][j] - x));
  };
  return { T, n, h, ys, at, t: (i) => i * h };
}

/** log-spaced array of n points from a to b */
export const logspace = (a, b, n) => Array.from({ length: n }, (_, i) => a * Math.pow(b / a, i / (n - 1)));

/** TeX for a number: fixed decimals in [0.01, 1000), scientific otherwise. */
export function nz(v, x, d = 3) {
  if (!isFinite(x)) return '\\infty';
  const a = Math.abs(x);
  if (a === 0) return '0';
  if (a >= 0.01 && a < 1000) return v.fix(x, a < 0.1 ? d + 1 : a < 10 ? d : d - 1);
  return v.sci(x, d);
}
