// Quantum Mechanics — Chapter 2: helpers shared by ch02.js and ch02-b.js.
// Units in the 1D simulations: ħ = m = 1 unless an item says otherwise.

export const TAU = 2 * Math.PI;

/** Uniform grid of n points on [x0, x1] (both ends included). */
export function grid(x0, x1, n) {
  const dx = (x1 - x0) / (n - 1);
  return { x: Float64Array.from({ length: n }, (_, i) => x0 + i * dx), dx, n };
}

/** Normalised Gaussian packet e^{−(x−x0)²/4σ²} e^{i(k0 x + phase)} on the grid x: {re, im}. */
export function packet(x, x0, sigma, k0, phase = 0) {
  const n = x.length, re = new Float64Array(n), im = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.exp(-((x[i] - x0) ** 2) / (4 * sigma * sigma)), ph = k0 * x[i] + phase;
    re[i] = a * Math.cos(ph); im[i] = a * Math.sin(ph);
  }
  normalize(re, im, x[1] - x[0]);
  return { re, im };
}

/** ∫|ψ|² dx by the trapezoid rule (the ends are ~0 for all our states). */
export function normSq(re, im, dx) {
  let s = 0; for (let i = 0; i < re.length; i++) s += re[i] * re[i] + im[i] * im[i];
  return s * dx;
}
/** Rescale ψ in place to ∫|ψ|² = 1; returns the old norm². */
export function normalize(re, im, dx) {
  const N = normSq(re, im, dx), c = N > 0 ? 1 / Math.sqrt(N) : 0;
  for (let i = 0; i < re.length; i++) { re[i] *= c; im[i] *= c; }
  return N;
}

/**
 * Position and momentum moments of ψ on a uniform grid (ħ = 1 unless given):
 * {N, mx, sx, mp, sp} with ⟨p⟩ = ħ∫(Re ψ ∂Im ψ − Im ψ ∂Re ψ) dx and ⟨p²⟩ = ħ²∫|ψ'|² dx (central differences).
 */
export function moments(x, re, im, hbar = 1) {
  const n = x.length, dx = x[1] - x[0];
  let N = 0, m1 = 0, m2 = 0, p1 = 0, p2 = 0;
  for (let i = 0; i < n; i++) { const r = re[i] * re[i] + im[i] * im[i]; N += r; m1 += r * x[i]; m2 += r * x[i] * x[i]; }
  for (let i = 1; i < n - 1; i++) {
    const dr = (re[i + 1] - re[i - 1]) / (2 * dx), di = (im[i + 1] - im[i - 1]) / (2 * dx);
    p1 += re[i] * di - im[i] * dr;
  }
  for (let i = 0; i < n - 1; i++) { const dr = (re[i + 1] - re[i]) / dx, di = (im[i + 1] - im[i]) / dx; p2 += dr * dr + di * di; }
  N *= dx; m1 *= dx; m2 *= dx; p1 *= dx * hbar; p2 *= dx * hbar * hbar;
  const mx = m1 / N, mp = p1 / N;
  return { N, mx, sx: Math.sqrt(Math.max(0, m2 / N - mx * mx)), mp, sp: Math.sqrt(Math.max(0, p2 / N - mp * mp)) };
}

/** Probability current j = (ħ/m) Im(ψ* ψ') at every grid point. */
export function current(re, im, dx, hbar = 1, mass = 1) {
  const n = re.length, j = new Float64Array(n);
  for (let i = 1; i < n - 1; i++) {
    const dr = (re[i + 1] - re[i - 1]) / (2 * dx), di = (im[i + 1] - im[i - 1]) / (2 * dx);
    j[i] = (hbar / mass) * (re[i] * di - im[i] * dr);
  }
  return j;
}

/**
 * Momentum-space wave function φ(p) = (2πħ)^{−1/2} ∫ e^{−ipx/ħ} ψ(x) dx by FFT, centred: {p, re, im, dp}.
 * Exact for the grid (a Riemann sum); p runs over −(n/2)·dp … (n/2 − 1)·dp with dp = 2πħ/(n dx).
 */
export function toMomentum(M, x, re, im, hbar = 1) {
  const n = x.length, dx = x[1] - x[0], R = Array.from(re), I = Array.from(im);
  M.fft(R, I);
  const dp = (TAU * hbar) / (n * dx), c = dx / Math.sqrt(TAU * hbar), h = n >> 1;
  const p = new Float64Array(n), pr = new Float64Array(n), pi = new Float64Array(n);
  for (let m = 0; m < n; m++) {
    const k = m - h, kk = (k + n) % n, pk = k * dp, ph = (-pk * x[0]) / hbar, cr = Math.cos(ph), ci = Math.sin(ph);
    p[m] = pk; pr[m] = c * (R[kk] * cr - I[kk] * ci); pi[m] = c * (R[kk] * ci + I[kk] * cr);
  }
  return { p, re: pr, im: pi, dp };
}

/**
 * Split-step Fourier propagator for iψ_t = −½ψ'' + Vψ (ħ = m = 1) on a periodic grid of n = 2^k points.
 * step(re, im) advances by dt in place: e^{−iV dt/2} e^{−iT dt} e^{−iV dt/2} — each factor unitary.
 */
export function splitStepper(M, V, dx, dt) {
  const n = V.length, kc = new Float64Array(n), ks = new Float64Array(n), vc = new Float64Array(n), vs = new Float64Array(n);
  for (let m = 0; m < n; m++) {
    const k = (TAU * (m < n / 2 ? m : m - n)) / (n * dx), a = -0.5 * k * k * dt;
    kc[m] = Math.cos(a); ks[m] = Math.sin(a);
    const b = -0.5 * V[m] * dt; vc[m] = Math.cos(b); vs[m] = Math.sin(b);
  }
  const R = new Array(n), I = new Array(n);
  const half = (re, im) => { for (let i = 0; i < n; i++) { const r = re[i], q = im[i]; re[i] = r * vc[i] - q * vs[i]; im[i] = r * vs[i] + q * vc[i]; } };
  return (re, im) => {
    half(re, im);
    for (let i = 0; i < n; i++) { R[i] = re[i]; I[i] = im[i]; }
    M.fft(R, I);
    for (let i = 0; i < n; i++) { const r = R[i], q = I[i]; R[i] = r * kc[i] - q * ks[i]; I[i] = r * ks[i] + q * kc[i]; }
    M.ifft(R, I);
    for (let i = 0; i < n; i++) { re[i] = R[i]; im[i] = I[i]; }
    half(re, im);
  };
}

/** Inverse-CDF sampler for a density given at grid points xs (trapezoids, linear interpolation): u ∈ [0,1) ↦ x. */
export function sampler(xs, ps) {
  const n = xs.length, cdf = new Float64Array(n); let s = 0;
  for (let i = 1; i < n; i++) { s += 0.5 * (ps[i] + ps[i - 1]) * (xs[i] - xs[i - 1]); cdf[i] = s; }
  const f = (u) => {
    const t = u * s; let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cdf[m] < t) lo = m; else hi = m; }
    const w = (t - cdf[lo]) / (cdf[hi] - cdf[lo] || 1); return xs[lo] + w * (xs[hi] - xs[lo]);
  };
  f.cdf = (x) => { if (x <= xs[0]) return 0; if (x >= xs[n - 1]) return 1; const k = Math.min(n - 2, Math.floor(((x - xs[0]) / (xs[n - 1] - xs[0])) * (n - 1))); const w = (x - xs[k]) / (xs[k + 1] - xs[k]); return (cdf[k] + w * (cdf[k + 1] - cdf[k])) / s; };
  f.total = s;
  return f;
}

/** Kolmogorov–Smirnov distance between sorted samples and a CDF. */
export function ksDistance(sorted, cdf) {
  const n = sorted.length; let d = 0;
  for (let i = 0; i < n; i++) { const F = cdf(sorted[i]); d = Math.max(d, Math.abs(F - i / n), Math.abs(F - (i + 1) / n)); }
  return d;
}

/** Phase → colour lookup on the quantum kit's wheel (0 blue, π/2 pink, π orange, −π/2 green); rebuild per render (theme-aware). */
export function phaseLUT(v, n = 120) {
  const Q = v.quantum(), lut = [];
  for (let i = 0; i < n; i++) lut.push(Q.phaseColor((i / n) * TAU));
  const f = (phi) => lut[((Math.round((phi / TAU) * n) % n) + n) % n];
  f.lut = lut;
  return f;
}

/**
 * Draw a wave function as phase-coloured amplitude: for every pixel column, a bar from `base` up to base + scale·|ψ|
 * (mode 'abs') or base + scale·|ψ|² (mode 'abs2'), filled with the colour of arg ψ; then the outline in ink.
 * o: {col (phaseLUT), mode, scale, base, outline, width, alpha, down (bars hang downward)}.
 */
export function drawPsi(s, x, re, im, o = {}) {
  const col = o.col, n = x.length, dx = x[1] - x[0], scale = o.scale ?? 1, base = o.base ?? 0, sq = o.mode === 'abs2';
  const c = s.ctx, Xa = Math.max(0, Math.ceil(s.X(Math.max(x[0], s.xr[0])))), Xb = Math.min(s.W, Math.floor(s.X(Math.min(x[n - 1], s.xr[1]))));
  const yb = s.Y(base);
  c.save(); c.globalAlpha = o.alpha ?? 0.92;
  for (let P = Xa; P < Xb; P++) {
    const xx = s.invX(P + 0.5), f = (xx - x[0]) / dx, i = Math.max(0, Math.min(n - 2, Math.floor(f))), t = f - i;
    const r = re[i] + t * (re[i + 1] - re[i]), q = im[i] + t * (im[i + 1] - im[i]), a = sq ? r * r + q * q : Math.hypot(r, q);
    const yt = s.Y(base + scale * a);
    if (Math.abs(yt - yb) < 0.3) continue;
    c.fillStyle = col ? col(Math.atan2(q, r)) : 'gray';
    c.fillRect(P, Math.min(yt, yb), 1.02, Math.abs(yb - yt));
  }
  c.restore();
  if (o.outline !== false) {
    const pts = []; const step = Math.max(1, Math.floor(n / 900));
    for (let i = 0; i < n; i += step) { const a = sq ? re[i] * re[i] + im[i] * im[i] : Math.hypot(re[i], im[i]); pts.push([x[i], base + scale * a]); }
    s.path(pts, { color: o.outline || 'ink', width: o.width ?? 1.5 });
  }
}

/** A small phase wheel at pixel position (px, py) with radius r (legend for drawPsi). */
export function phaseWheel(s, col, px, py, r = 13, label = 'arg ψ') {
  const c = s.ctx, n = 48;
  c.save();
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * TAU, a1 = ((k + 1.05) / n) * TAU;
    c.beginPath(); c.arc(px, py, r, -a1, -a0); c.arc(px, py, r * 0.45, -a0, -a1, true); c.closePath();
    c.fillStyle = col(((k + 0.5) / n) * TAU); c.fill();
  }
  c.restore();
  s.textPx('0', px + r + 3, py, { size: 9.5, color: 'muted', baseline: 'middle' });
  s.textPx('π', px - r - 3, py, { size: 9.5, color: 'muted', baseline: 'middle', align: 'right' });
  if (label) s.textPx(label, px, py - r - 3, { size: 10, color: 'muted', align: 'center', baseline: 'bottom' });
}

/**
 * A simulation slaved to the animation clock: sim.at(t) steps forward until its own time reaches t
 * (restarting from init() when t goes backwards), so a frame depends only on t — screenshots are reproducible.
 */
export function clockSim(init, step, dt, maxSteps = 40000) {
  let T = 0, st = null, k = 0;
  return {
    at(t) {
      if (!st || t < T - 1e-9) { st = init(); T = 0; k = 0; }
      let c = 0;
      while (T + dt <= t + 1e-9 && c < maxSteps) { step(st, dt); T += dt; c++; k++; }
      return st;
    },
    reset() { st = null; },
    get T() { return T; },
    get steps() { return k; },
  };
}

/** Thousands separators. */
export const big = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
