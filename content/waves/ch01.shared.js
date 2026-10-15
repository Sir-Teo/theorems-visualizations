// Waves & Optics — Chapter 1 shared helpers (strings, beaded chains, moving sources).
// Plain named exports, imported by ch01.js and ch01-b.js.

export const TAU = 2 * Math.PI;
const LN2x4 = 4 * Math.LN2;

/**
 * Pulse profiles of unit height and full width at half maximum 1 (u = (x − x0)/w):
 * 'gauss' smooth, 'skew' steep front (u > 0) and long tail (u < 0), 'tri' kinked, 'box' sharp-edged.
 */
export function pulse(name, u) {
  if (name === 'gauss') return Math.exp(-LN2x4 * u * u);
  if (name === 'skew') return u > 0 ? Math.exp(-LN2x4 * 4 * u * u) : Math.exp(-LN2x4 * u * u / 2.25);
  if (name === 'tri') return Math.max(0, 1 - Math.abs(u));
  if (name === 'box') return Math.abs(u) < 0.5 ? 1 : 0;
  if (name === 'wiggle') return -2 * LN2x4 * u * Math.exp(-LN2x4 * u * u) / 2.353;
  return 0;
}
/** Derivative d/du of the smooth profiles (numerical for the rest). */
export function dpulse(name, u) {
  if (name === 'gauss') return -2 * LN2x4 * u * Math.exp(-LN2x4 * u * u);
  if (name === 'skew') return u > 0 ? -8 * LN2x4 * u * Math.exp(-LN2x4 * 4 * u * u) : (-2 * LN2x4 * u / 2.25) * Math.exp(-LN2x4 * u * u / 2.25);
  const h = 1e-4; return (pulse(name, u + h) - pulse(name, u - h)) / (2 * h);
}

/**
 * A beaded model of a string under uniform tension T whose mass density mu(x) may vary.
 * Beads are spaced so that a wave needs the same time `delta` to cross every gap (h = c(x)·delta), and they sit
 * exactly on the breakpoints `breaks` (interfaces), so each gap lies in one medium. Then
 *   m_i ÿ_i = T (y_{i+1} − y_i)/h_i − T (y_i − y_{i−1})/h_{i−1} + F_i,
 * which is the wave equation μ y_tt = T y_xx in every medium, with the junction conditions (continuity of y and of
 * the transverse force) coming out by themselves. Ends: 'fixed' (y = 0), 'free' (ring on a frictionless rod),
 * 'driven' (massless ring pushed by a force: y_0 = y_1 + F h_0/T at every instant). `damp(x)` (1/s) adds a sponge.
 */
export function makeChain({ x0, x1, mu, T = 1, delta, breaks = [], left = 'fixed', right = 'fixed', damp = null }) {
  const B = [x0, ...breaks.filter((b) => b > x0 && b < x1).sort((a, b) => a - b), x1];
  const xs = [x0];
  for (let k = 0; k + 1 < B.length; k++) {
    const a = B[k], b = B[k + 1], S = 2000;
    // travel time τ(x) = ∫ dx / c on a fine grid, then beads uniformly in τ
    const tau = new Float64Array(S + 1);
    for (let j = 1; j <= S; j++) { const xm = a + ((j - 0.5) / S) * (b - a); tau[j] = tau[j - 1] + ((b - a) / S) * Math.sqrt(mu(xm) / T); }
    const n = Math.max(1, Math.round(tau[S] / delta));
    let j = 0;
    for (let i = 1; i < n; i++) {
      const target = (tau[S] * i) / n;
      while (tau[j + 1] < target) j++;
      const f = (target - tau[j]) / (tau[j + 1] - tau[j]);
      xs.push(a + ((j + f) / S) * (b - a));
    }
    xs.push(b);
  }
  const N = xs.length, x = Float64Array.from(xs);
  const h = new Float64Array(N - 1), k = new Float64Array(N - 1), musg = new Float64Array(N - 1), m = new Float64Array(N);
  for (let i = 0; i < N - 1; i++) { h[i] = x[i + 1] - x[i]; musg[i] = mu(0.5 * (x[i] + x[i + 1])); k[i] = T / h[i]; }
  for (let i = 0; i < N; i++) m[i] = 0.5 * ((i > 0 ? musg[i - 1] * h[i - 1] : 0) + (i < N - 1 ? musg[i] * h[i] : 0));
  const g = new Float64Array(N); if (damp) for (let i = 0; i < N; i++) g[i] = damp(x[i]);
  const y = new Float64Array(N), v = new Float64Array(N), a = new Float64Array(N);
  const C = { N, x, h, k, m, mu: musg, y, v, a, T, t: 0, delta, left, right, force: null, F: 0, Fmid: 0, ends: [left, right] };
  const fixL = left === 'fixed', fixR = right === 'fixed', drvL = left === 'driven';
  const acc = () => {
    for (let i = 0; i < N; i++) {
      const fl = i > 0 ? k[i - 1] * (y[i - 1] - y[i]) : 0, fr = i < N - 1 ? k[i] * (y[i + 1] - y[i]) : 0;
      a[i] = (fl + fr) / m[i];
    }
    if (fixL) a[0] = 0; if (fixR) a[N - 1] = 0;
  };
  C.set = (fy, fv) => {
    for (let i = 0; i < N; i++) { y[i] = fy ? fy(x[i]) : 0; v[i] = fv ? fv(x[i]) : 0; }
    if (fixL) y[0] = v[0] = 0; if (fixR) y[N - 1] = v[N - 1] = 0;
    C.t = 0; acc();
  };
  C.step = (dt) => {
    const y0old = y[0];
    for (let i = 0; i < N; i++) { v[i] += 0.5 * dt * a[i]; y[i] += dt * v[i]; }
    C.t += dt;
    let vr = 0;
    if (drvL) { const F = C.force ? C.force(C.t) : 0; C.Fmid = 0.5 * (F + C.F); C.F = F; const y0 = y[1] + (F * h[0]) / T; vr = (y0 - y0old) / dt; y[0] = y0; }
    acc();
    for (let i = 0; i < N; i++) v[i] += 0.5 * dt * a[i];
    if (drvL) v[0] = vr; // the massless ring: its velocity comes from the constraint, not from Newton's law
    if (damp) for (let i = 0; i < N; i++) if (g[i]) v[i] *= Math.exp(-g[i] * dt);
    if (fixL) y[0] = v[0] = 0; if (fixR) y[N - 1] = v[N - 1] = 0;
  };
  /** Advance to time t with steps of at most dtMax (never more than maxSteps at once). */
  C.advance = (t, dtMax = 0.5 * delta, maxSteps = 200000) => {
    let n = 0; while (C.t < t - 1e-12 && n++ < maxSteps) C.step(Math.min(dtMax, t - C.t));
  };
  /** Kinetic and potential energy of the beads / springs whose position lies in [xa, xb). */
  C.energy = (xa = -Infinity, xb = Infinity) => {
    let K = 0, U = 0;
    for (let i = 0; i < N; i++) if (x[i] >= xa && x[i] < xb) K += 0.5 * m[i] * v[i] * v[i];
    for (let i = 0; i < N - 1; i++) { const xm = 0.5 * (x[i] + x[i + 1]); if (xm >= xa && xm < xb) { const d = y[i + 1] - y[i]; U += 0.5 * k[i] * d * d; } }
    return { K, U, E: K + U };
  };
  /** Displacement at position X (linear interpolation between beads). */
  C.at = (X) => {
    if (X <= x[0]) return y[0]; if (X >= x[N - 1]) return y[N - 1];
    let lo = 0, hi = N - 1; while (hi - lo > 1) { const md = (lo + hi) >> 1; if (x[md] <= X) lo = md; else hi = md; }
    const f = (X - x[lo]) / (x[hi] - x[lo]); return y[lo] + f * (y[hi] - y[lo]);
  };
  /** Polyline of the string, [[x, y], …] (optionally only beads with x in [xa, xb]). */
  C.pts = (xa = -Infinity, xb = Infinity, sy = 1) => { const p = []; for (let i = 0; i < N; i++) if (x[i] >= xa && x[i] <= xb) p.push([x[i], y[i] * sy]); return p; };
  /** Largest |y| (and where) among beads in [xa, xb]. */
  C.peak = (xa, xb) => { let best = 0, at = NaN; for (let i = 0; i < N; i++) if (x[i] >= xa && x[i] <= xb && Math.abs(y[i]) > Math.abs(best)) { best = y[i]; at = x[i]; } return { y: best, x: at }; };
  return C;
}

/**
 * Input impedance looking into a stack of string sections at angular frequency ω (T = 1, so a section of density μ
 * has impedance Z = √μ and wavenumber k = ω√μ). layers = [[Z, length], …] from left to right; Zload terminates
 * the stack on the right. Returns the complex reflection coefficient {re, im} seen from a medium of impedance Z1.
 * Uses the transmission-line rule Z_in = Z (Z_L + i Z tan kd)/(Z + i Z_L tan kd), applied right to left.
 */
export function stackReflection(Z1, layers, Zload, omega) {
  let zr = Zload, zi = 0;
  for (let j = layers.length - 1; j >= 0; j--) {
    const [Z, d] = layers[j], t = Math.tan(omega * Z * d); // k = ω/c = ω·Z (T = 1)
    // (zr + i zi + i Z t) / (Z + i (zr + i zi) t) · Z
    const nr = zr, ni = zi + Z * t, dr = Z - zi * t, di = zr * t;
    const den = dr * dr + di * di;
    const qr = (nr * dr + ni * di) / den, qi = (ni * dr - nr * di) / den;
    zr = Z * qr; zi = Z * qi;
  }
  // r = (Zin − Z1)/(Zin + Z1) for the displacement wave… sign convention: r = (Z1 − Zin)/(Z1 + Zin)
  const nr = Z1 - zr, ni = -zi, dr = Z1 + zr, di = zi, den = dr * dr + di * di;
  return { re: (nr * dr + ni * di) / den, im: (ni * dr - nr * di) / den };
}

/**
 * Emission times of a source moving uniformly, S(t) = S0 + V t, heard at the point O at time t (wave speed c):
 * the roots t_e ≤ t of |O − S(t_e)| = c (t − t_e). One root when |V| < c, zero or two when |V| > c.
 */
export function retarded(t, O, S0, V, c) {
  const Dx = O[0] - S0[0], Dy = O[1] - S0[1], V2 = V[0] * V[0] + V[1] * V[1];
  const A = V2 - c * c, Bq = 2 * c * c * t - 2 * (Dx * V[0] + Dy * V[1]), Cq = Dx * Dx + Dy * Dy - c * c * t * t;
  const out = [];
  if (Math.abs(A) < 1e-12) { const r = -Cq / Bq; if (r <= t) out.push(r); return out; }
  const disc = Bq * Bq - 4 * A * Cq; if (disc < 0) return out;
  const sq = Math.sqrt(disc);
  for (const r of [(-Bq - sq) / (2 * A), (-Bq + sq) / (2 * A)]) if (r <= t + 1e-12) out.push(r);
  return out.sort((a, b) => a - b);
}

/**
 * Pressure heard by a listener at O (metres) from a point source moving at velocity V (m/s) along a straight line
 * through S0 at t = 0, emitting the signal s(t_e): p(t) = Σ s(t_e)/r over all retarded times (monopole, 3D spreading).
 * Returns a Float32Array of dur seconds at rate sr, normalised to peak 0.8, with short fades.
 */
export function movingSourceSound(s, O, S0, V, c, dur, sr = 44100, t0 = -dur / 2, rmin = 1) {
  const n = Math.round(dur * sr), out = new Float32Array(n);
  let peak = 0;
  for (let i = 0; i < n; i++) {
    const t = t0 + i / sr; let p = 0;
    for (const te of retarded(t, O, S0, V, c)) { const r = Math.max(rmin, c * (t - te)); p += s(te) / r; }
    out[i] = p; peak = Math.max(peak, Math.abs(p));
  }
  const k = peak > 0 ? 0.8 / peak : 0, f = Math.round(0.03 * sr);
  for (let i = 0; i < n; i++) out[i] *= k * Math.min(1, i / f, (n - 1 - i) / f);
  return out;
}

/** A fixed end: a hatched wall at x (data units), from y0 to y1, on the side `side` (+1 right, −1 left). */
export function wall(s, x, y0, y1, side = 1, w = 0.06) {
  s.rect(x, y0, x + side * w, y1, { fill: 'muted', fillAlpha: 0.12, hatch: 'muted', hatchGap: 5, stroke: false });
  s.line(x, y0, x, y1, { color: 'muted', width: 2 });
}
/** A free end: a vertical frictionless rod at x with a ring at height y. */
export function rod(s, x, y0, y1, y) {
  s.line(x, y0, x, y1, { color: 'muted', width: 2.5 });
  s.dot(x, y, { r: 5, hollow: true, color: 'ink', width: 2 });
}

/** Time-integrated running mean helper: keeps the last n samples. */
export function ring(n) {
  const a = new Float64Array(n); let i = 0, full = false;
  return {
    push(x) { a[i] = x; i = (i + 1) % n; if (i === 0) full = true; },
    get length() { return full ? n : i; },
    /** k-th oldest sample still kept */
    at(k) { const L = full ? n : i; const j = full ? (i + k) % n : k; return k < L ? a[j] : NaN; },
    clear() { i = 0; full = false; },
  };
}
