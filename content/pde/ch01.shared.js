// Partial Differential Equations — Chapter 1 shared helpers (finite differences, a heated rod, symbols of
// second-order operators). Plain named exports, imported by ch01.js and ch01-b.js.

/** Solve a tridiagonal system (sub-diagonal lo, diagonal di, super-diagonal up, right side rhs) by the Thomas algorithm. */
export function thomas(lo, di, up, rhs) {
  const n = di.length, c = new Float64Array(n), d = new Float64Array(n), x = new Float64Array(n);
  c[0] = up[0] / di[0]; d[0] = rhs[0] / di[0];
  for (let i = 1; i < n; i++) {
    const m = di[i] - lo[i] * c[i - 1];
    c[i] = up[i] / m; d[i] = (rhs[i] - lo[i] * d[i - 1]) / m;
  }
  x[n - 1] = d[n - 1];
  for (let i = n - 2; i >= 0; i--) x[i] = d[i] - c[i] * x[i + 1];
  return x;
}

/**
 * Derivatives of g(x, t) by central differences (step h): {u, ux, ut, uxx, uxt, utt}. With h = 2e-3 the truncation and
 * rounding errors are both of order 1e-8 for smooth g, far below anything drawn.
 */
export function derivs(g, x, t, h = 2e-3) {
  const u = g(x, t), xp = g(x + h, t), xm = g(x - h, t), tp = g(x, t + h), tm = g(x, t - h);
  return {
    u, ux: (xp - xm) / (2 * h), ut: (tp - tm) / (2 * h),
    uxx: (xp - 2 * u + xm) / (h * h), utt: (tp - 2 * u + tm) / (h * h),
    uxt: (g(x + h, t + h) - g(x + h, t - h) - g(x - h, t + h) + g(x - h, t - h)) / (4 * h * h),
  };
}

/**
 * Heated rod on [0, 1], u_t = k u_xx, n cells, backward Euler on a finite-volume grid (the end nodes own half a cell, so
 * the boundary conditions enter as heat balances). Each end is {type: 'D', g} (u = g), {type: 'N'} (insulated, u_x = 0) or
 * {type: 'R', a, T} (Newton cooling u_n + a (u − T) = 0, n the outward normal; a ≥ 0).
 */
export function makeRod(n, k, left, right) {
  const h = 1 / n, x = new Float64Array(n + 1);
  for (let i = 0; i <= n; i++) x[i] = i * h;
  const R = { n, h, x, u: new Float64Array(n + 1), t: 0, k, left, right };
  R.step = (dt) => {
    const u = R.u, lo = new Float64Array(n + 1), di = new Float64Array(n + 1), up = new Float64Array(n + 1), rhs = new Float64Array(n + 1);
    const r = (k * dt) / (h * h);
    for (let i = 1; i < n; i++) { lo[i] = -r; di[i] = 1 + 2 * r; up[i] = -r; rhs[i] = u[i]; }
    const end = (E, i, nb, sgn) => {
      if (E.type === 'D') { di[i] = 1; rhs[i] = E.g; if (sgn > 0) up[i] = 0; else lo[i] = 0; return; }
      // half cell: (h/2) u_t = k (u_nb − u_i)/h − k a (u_i − T)   [Robin],  a = 0 for insulation
      const a = E.type === 'R' ? E.a : 0, T = E.type === 'R' ? E.T : 0, q = (2 * dt) / h;
      di[i] = 1 + q * (k / h + k * a); rhs[i] = u[i] + q * k * a * T;
      if (sgn > 0) up[i] = -q * (k / h); else lo[i] = -q * (k / h);
    };
    end(left, 0, 1, +1); end(right, n, n - 1, -1);
    R.u = thomas(lo, di, up, rhs); R.t += dt;
    return R;
  };
  R.mass = () => { let s = 0; for (let i = 0; i <= n; i++) s += R.u[i] * h * (i === 0 || i === n ? 0.5 : 1); return s; };
  return R;
}

/** Eigen-decomposition of the symmetric coefficient matrix [[a, b], [b, c]] → {l1 ≥ l2, v1, v2 (unit), type, disc = b² − ac}. */
export function symbol(a, b, c, tol = 1e-9) {
  const m = (a + c) / 2, d = Math.hypot((a - c) / 2, b), l1 = m + d, l2 = m - d;
  const ang = 0.5 * Math.atan2(2 * b, a - c);
  const v1 = [Math.cos(ang), Math.sin(ang)], v2 = [-Math.sin(ang), Math.cos(ang)];
  const sc = Math.max(1e-12, Math.abs(l1), Math.abs(l2));
  let type = 'hyperbolic';
  if (Math.abs(l1) < tol * sc || Math.abs(l2) < tol * sc) type = 'parabolic';
  else if (l1 * l2 > 0) type = 'elliptic';
  if (Math.abs(l1) < 1e-12 && Math.abs(l2) < 1e-12) type = 'degenerate';
  return { l1, l2, v1, v2, type, disc: b * b - a * c };
}

/**
 * Real characteristic directions (unit vectors d with d_perp^T A d_perp = 0, i.e. curves whose normal ν satisfies
 * a ν_x² + 2b ν_x ν_y + c ν_y² = 0) of a u_xx + 2b u_xy + c u_yy: 0, 1 or 2 directions.
 */
export function charDirs(a, b, c, tol = 1e-9) {
  const sc = Math.max(1e-12, Math.abs(a), Math.abs(b), Math.abs(c)), D = b * b - a * c;
  if (Math.abs(a) < tol * sc && Math.abs(b) < tol * sc && Math.abs(c) < tol * sc) return [];
  // tangent (dx, dy) of a characteristic: a dy² − 2b dx dy + c dx² = 0
  const out = [];
  const push = (dx, dy) => { const n = Math.hypot(dx, dy); out.push([dx / n, dy / n]); };
  if (Math.abs(D) < tol * sc * sc) {
    if (Math.abs(a) > tol * sc) push(a, b); else if (Math.abs(c) > tol * sc) push(0, 1);
    return out;
  }
  if (D < 0) return [];
  const s = Math.sqrt(D);
  if (Math.abs(a) > tol * sc) { push(a, b + s); push(a, b - s); }
  else { push(0, 1); push(2 * b, c); } // a = 0: dx (c dx − 2b dy) = 0
  return out;
}
