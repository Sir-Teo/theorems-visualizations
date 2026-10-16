// Mathematical Biology, chapter 1 — helpers shared by ch01.js and ch01-b.js (plain functions only).

/** Classical RK4 for a scalar ODE y' = f(t, y); returns [[t, y], …] (n steps), stopping early if y <= floor. */
export function traj1(f, y0, T, n = 400, floor = null) {
  const h = T / n, out = [[0, y0]];
  let y = y0;
  for (let i = 0; i < n; i++) {
    const t = i * h;
    const k1 = f(t, y), k2 = f(t + h / 2, y + (h / 2) * k1), k3 = f(t + h / 2, y + (h / 2) * k2), k4 = f(t + h, y + h * k3);
    y += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    if (floor != null && y <= floor) { out.push([(i + 1) * h, floor]); break; }
    out.push([(i + 1) * h, y]);
  }
  return out;
}

/** All sign-change roots of g on [a, b] (every grid point is tested, exact zeros included). */
export function roots1(g, a, b, n = 600) {
  const out = [];
  let xp = a, gp = g(a);
  if (gp === 0) out.push(a);
  for (let i = 1; i <= n; i++) {
    const x = a + ((b - a) * i) / n, gx = g(x);
    if (gx === 0) out.push(x);
    else if (gp !== 0 && gp * gx < 0) {
      let lo = xp, hi = x, glo = gp;
      for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2, gm = g(m); if (glo * gm <= 0) hi = m; else { lo = m; glo = gm; } }
      out.push((lo + hi) / 2);
    }
    xp = x; gp = gx;
  }
  return out;
}

/** Central-difference derivative. */
export function d1(f, x, h = 1e-5) { return (f(x + h) - f(x - h)) / (2 * h); }

/** Heun integration of x'(t) = F(x(t), x(t - tau)) with constant history x0 on [-tau, 0]; tau = m h exactly. */
export function ddeRun(F, x0, m, h, steps) {
  const X = new Float64Array(m + steps + 1).fill(x0);
  for (let i = m; i < m + steps; i++) {
    const k1 = F(X[i], X[i - m]);
    const k2 = F(X[i] + h * k1, X[i + 1 - m]);
    X[i + 1] = X[i] + (h / 2) * (k1 + k2);
  }
  return X;
}

// ---- complex helpers (pairs [re, im]) for Lambert-W roots of  lambda = -r exp(-lambda tau) ----

/**
 * Roots w of  w e^w = -x  (x > 0): the Lambert-W branches. Returns [re, im] pairs (both members of each conjugate
 * pair; two real roots when x < 1/e), sorted by decreasing real part; `pairs` counts the complex pairs beyond the
 * leading one. With w = a + i*theta the equation reduces to a = -theta cot(theta), x = theta e^a / sin(theta),
 * which is monotone in theta on (2 k pi, (2k+1) pi): solved by bisection (robust everywhere).
 */
export function lambertRoots(x, pairs = 4) {
  const out = [];
  const onBranch = (lo, hi) => {
    const X = (th) => th * Math.exp(-th / Math.tan(th)) / Math.sin(th);
    let a = lo + 1e-9, b = hi - 1e-9;
    for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (X(m) < x) a = m; else b = m; }
    const th = (a + b) / 2;
    return [-th / Math.tan(th), th];
  };
  if (x > 1 / Math.E) { const w = onBranch(0, Math.PI); out.push(w, [w[0], -w[1]]); }
  else {
    const F = (w) => w * Math.exp(w) + x;
    const bis = (lo, hi) => { for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (F(lo) * F(m) <= 0) hi = m; else lo = m; } return [(lo + hi) / 2, 0]; };
    out.push(bis(-1, 0), bis(-60, -1));
  }
  for (let k = 1; k <= pairs; k++) { const w = onBranch(2 * k * Math.PI, (2 * k + 1) * Math.PI); out.push(w, [w[0], -w[1]]); }
  return out.sort((p, q) => q[0] - p[0] || q[1] - p[1]);
}
