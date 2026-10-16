// Partial Differential Equations — Chapter 2 shared helpers (the one-dimensional wave equation). Plain named exports,
// imported by ch02.js and ch02-b.js.

/** Smooth bump profile: sum of Gaussians with amplitudes a[i] centred at xs[i], common width w. */
export function gaussSum(a, xs, w) {
  return (x) => { let s = 0; for (let i = 0; i < a.length; i++) { const z = (x - xs[i]) / w; s += a[i] * Math.exp(-z * z); } return s; };
}

/** Fold x into [0, L] by repeated reflection; returns [x', sign], the sign being s0 per reflection at 0 and sL per reflection at L. */
export function fold(x, L, s0, sL) {
  let sg = 1, n = 0;
  while ((x < 0 || x > L) && n++ < 200) {
    if (x < 0) { x = -x; sg *= s0; } else { x = 2 * L - x; sg *= sL; }
  }
  return [x, sg];
}

/** Extension of f (given on [0, L]) across the ends: odd (s = -1, fixed end) or even (s = +1, free end) at each end. */
export function extend(f, L, s0, sL) {
  return (x) => { const [y, sg] = fold(x, L, s0, sL); return sg * f(y); };
}

/** Cumulative integral of f from a, tabulated on n cells and interpolated linearly; returns F with F(x) = ∫_a^x f (clamped outside). */
export function cumulative(f, a, b, n = 4000) {
  const h = (b - a) / n, F = new Float64Array(n + 1);
  let prev = f(a);
  for (let i = 1; i <= n; i++) { const cur = f(a + i * h); F[i] = F[i - 1] + 0.5 * h * (prev + cur); prev = cur; }
  return (x) => {
    if (x <= a) return 0;
    if (x >= b) return F[n];
    const q = (x - a) / h, i = Math.floor(q), r = q - i;
    return F[i] * (1 - r) + F[i + 1] * r;
  };
}

/**
 * d'Alembert's solution u(x, t) = ½[φ(x+ct) + φ(x−ct)] + (1/2c) ∫_{x−ct}^{x+ct} ψ for data φ, ψ (functions on the line,
 * possibly extensions). The antiderivative of ψ is tabulated on [a, b], which must contain every argument that will be used.
 */
export function dAlembert(phi, psi, c, a, b, n = 4000) {
  const Ps = cumulative(psi, a, b, n);
  return (x, t) => 0.5 * (phi(x + c * t) + phi(x - c * t)) + (Ps(x + c * t) - Ps(x - c * t)) / (2 * c);
}

/** Solve a tridiagonal system by the Thomas algorithm. */
export function thomas(lo, di, up, rhs) {
  const n = di.length, c = new Float64Array(n), d = new Float64Array(n), x = new Float64Array(n);
  c[0] = up[0] / di[0]; d[0] = rhs[0] / di[0];
  for (let i = 1; i < n; i++) { const m = di[i] - lo[i] * c[i - 1]; c[i] = up[i] / m; d[i] = (rhs[i] - lo[i] * d[i - 1]) / m; }
  x[n - 1] = d[n - 1];
  for (let i = n - 2; i >= 0; i--) x[i] = d[i] - c[i] * x[i + 1];
  return x;
}

/**
 * Leapfrog solver for u_tt + 2γ u_t = c² u_xx − m² u + F(x, t) on [0, L] with N cells and fixed (u = 0) ends, time step
 * dt = nu · dx / c (nu is the Courant number; nu ≤ 1 is stable). Data: u(x, 0) = phi, u_t(x, 0) = psi. Second-order accurate
 * start (Taylor step). Fields: u (current), uo (previous), t, n.  energy() is the discrete ½∫(u_t² + c² u_x²) (+ m²u²).
 */
export function makeWave(N, L, c, nu, phi, psi, opts = {}) {
  const dx = L / N, dt = (nu * dx) / c, gam = opts.gamma || 0, m2 = opts.m2 || 0, F = opts.F || null;
  const W = { N, L, dx, dt, c, t: 0, n: 0, u: new Float64Array(N + 1), uo: new Float64Array(N + 1), ut: new Float64Array(N + 1) };
  const lap = (u, i) => (u[i + 1] - 2 * u[i] + u[i - 1]) / (dx * dx);
  for (let i = 0; i <= N; i++) W.u[i] = phi(i * dx);
  W.u[0] = 0; W.u[N] = 0;
  // u(−dt) from a Taylor expansion: u − dt·ψ + ½dt²·u_tt
  for (let i = 1; i < N; i++) {
    const x = i * dx, utt = c * c * lap(W.u, i) - m2 * W.u[i] - 2 * gam * psi(x) + (F ? F(x, 0) : 0);
    W.uo[i] = W.u[i] - dt * psi(x) + 0.5 * dt * dt * utt;
  }
  W.step = () => {
    const u = W.u, uo = W.uo, nw = new Float64Array(N + 1), t = W.t, a = 1 + gam * dt, b = 1 - gam * dt;
    for (let i = 1; i < N; i++) {
      const f = F ? F(i * dx, t) : 0;
      nw[i] = (2 * u[i] - b * uo[i] + dt * dt * (c * c * lap(u, i) - m2 * u[i] + f)) / a;
    }
    W.uo = u; W.u = nw; W.t += dt; W.n++;
  };
  W.energy = () => {
    // the energy the leapfrog scheme conserves exactly: kinetic from nodal (u − uo)/dt, potential from the product u_x · uo_x
    let k = 0, p = 0;
    for (let i = 1; i < N; i++) { const v = (W.u[i] - W.uo[i]) / W.dt; k += 0.5 * v * v * dx; if (m2) p += 0.5 * m2 * W.u[i] * W.uo[i] * dx; }
    for (let i = 0; i < N; i++) p += 0.5 * c * c * ((W.u[i + 1] - W.u[i]) / dx) * ((W.uo[i + 1] - W.uo[i]) / dx) * dx;
    return { k, p, e: k + p };
  };
  return W;
}
