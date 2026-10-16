// Quantum Mechanics — Chapter 6: helpers shared by ch06.js, ch06-b.js and ch06-c.js.
// ħ = 1 and m = 1 unless an item says otherwise (the bouncer uses ħ²/2m = mg = 1; Landau levels use e = ħ = m = 1).
// Re-exports the chapter 5 helpers (complex scalars, matrices, dials, …) and the wave-function drawing, Wigner and
// split-step helpers of chapters 2–4.
export * from './ch05.shared.js';
export { hermiteAt, project, evolve, covariance, wigner, wignerAt, husimi, paintPhase, interp, clockSim, levelDiagram } from './ch04.shared.js';
export { packet, splitStepper } from './ch02.shared.js';
export { probIn } from './ch03.shared.js';

const TAU2 = 2 * Math.PI;

/** Periodic grid of n = 2^k points on [−L/2, L/2): {x, dx, n}. */
export function pgrid(L, n) {
  const dx = L / n;
  return { x: Float64Array.from({ length: n }, (_, i) => -L / 2 + i * dx), dx, n };
}

/** Wavenumber of FFT bin j on a periodic grid of n points with spacing dx. */
export const kOf = (j, n, dx) => (TAU2 * (j < n / 2 ? j : j - n)) / (n * dx);

/** ψ(t) = F⁻¹ e^{−ik²t/2} F ψ for the free particle (exact on the periodic grid); in place. */
export function freeEvolve(M, re, im, dx, t) {
  const n = re.length, R = Array.from(re), I = Array.from(im);
  M.fft(R, I);
  for (let j = 0; j < n; j++) { const a = -0.5 * kOf(j, n, dx) ** 2 * t, c = Math.cos(a), s = Math.sin(a), r = R[j], q = I[j]; R[j] = r * c - q * s; I[j] = r * s + q * c; }
  M.ifft(R, I);
  for (let j = 0; j < n; j++) { re[j] = R[j]; im[j] = I[j]; }
}

/**
 * A product-formula stepper for iψ_t = (−½∂² + V)ψ on a periodic grid (n a power of two). mode:
 * 'strang' e^{−iVdt/2}e^{−iTdt}e^{−iVdt/2} (second order), 'lie' e^{−iTdt}e^{−iVdt} (first order);
 * with imag = true, t → −iτ: every factor is a real decay (the stepper does not conserve the norm).
 */
export function productStepper(M, V, dx, dt, mode = 'strang', imag = false) {
  const n = V.length, tc = new Float64Array(n), ts = new Float64Array(n), vc = new Float64Array(n), vs = new Float64Array(n);
  const f = mode === 'strang' ? 0.5 : 1;
  for (let j = 0; j < n; j++) {
    const a = 0.5 * kOf(j, n, dx) ** 2 * dt, b = V[j] * dt * f;
    if (imag) { tc[j] = Math.exp(-a); ts[j] = 0; vc[j] = Math.exp(-b); vs[j] = 0; } else { tc[j] = Math.cos(a); ts[j] = -Math.sin(a); vc[j] = Math.cos(b); vs[j] = -Math.sin(b); }
  }
  const R = new Float64Array(n), I = new Float64Array(n);
  const pot = (re, im) => { for (let j = 0; j < n; j++) { const r = re[j], q = im[j]; re[j] = r * vc[j] - q * vs[j]; im[j] = r * vs[j] + q * vc[j]; } };
  return (re, im) => {
    if (mode === 'strang') pot(re, im);
    else if (mode === 'lie') pot(re, im);
    for (let j = 0; j < n; j++) { R[j] = re[j]; I[j] = im[j]; }
    M.fft(R, I);
    for (let j = 0; j < n; j++) { const r = R[j], q = I[j]; R[j] = r * tc[j] - q * ts[j]; I[j] = r * ts[j] + q * tc[j]; }
    M.ifft(R, I);
    for (let j = 0; j < n; j++) { re[j] = R[j]; im[j] = I[j]; }
    if (mode === 'strang') pot(re, im);
  };
}

/** ⟨T⟩ = ∫ ½|ψ'|² dx for the (unnormalised) grid function, by FFT; returns the sum Σ½k²|ψ̂_k|²/n · dx (so ⟨T⟩ = this / ∫|ψ|²). */
export function kineticSum(M, re, im, dx) {
  const n = re.length, R = Array.from(re), I = Array.from(im);
  M.fft(R, I);
  let s = 0; for (let j = 0; j < n; j++) s += 0.5 * kOf(j, n, dx) ** 2 * (R[j] * R[j] + I[j] * I[j]);
  return (s * dx) / n;
}

/** Complex-valued Gaussian-packet closed form at one point: ψ(x,t) for ħ = m = 1, width σ, momentum k0, centre x0 (the free spreading packet). */
export function spreadPacket(x, t, x0, sigma, k0) {
  const s2 = sigma * sigma, d = [1, t / (2 * s2)], d2 = d[0] * d[0] + d[1] * d[1];
  // (1 + i t/2σ²)^{-1/2}
  const mod = Math.pow(d2, -0.25), arg = -0.5 * Math.atan2(d[1], d[0]);
  const X = x - x0 - k0 * t, inv = [d[0] / d2, -d[1] / d2]; // 1/(1+ it/2σ²)
  const ex = -(X * X) / (4 * s2), er = ex * inv[0], ei = ex * inv[1];
  const ph = k0 * (x - x0) - 0.5 * k0 * k0 * t + ei + arg, amp = (2 * Math.PI * s2) ** -0.25 * mod * Math.exp(er);
  return [amp * Math.cos(ph), amp * Math.sin(ph)];
}

// ------------------------------------------------------------------ Airy function (for the quantum bouncer)
let _airy = null;
/** Ai and Ai' tabulated on [−60, 7] by RK4 on y'' = x·y from Ai(0), Ai'(0) (DLMF 9.2.3–4). */
function airyTab() {
  if (_airy) return _airy;
  const h = 0.002, X0 = -60, X1 = 7, n = Math.round((X1 - X0) / h) + 1, ai = new Float64Array(n), ap = new Float64Array(n);
  const i0 = Math.round(-X0 / h), A0 = 0.3550280538878172, B0 = -0.2588194037928068;
  const rk = (x, y, d, s) => { // one RK4 step of size s for y'' = x y
    const f = (xx, yy) => xx * yy;
    const k1y = d, k1d = f(x, y);
    const k2y = d + 0.5 * s * k1d, k2d = f(x + 0.5 * s, y + 0.5 * s * k1y);
    const k3y = d + 0.5 * s * k2d, k3d = f(x + 0.5 * s, y + 0.5 * s * k2y);
    const k4y = d + s * k3d, k4d = f(x + s, y + s * k3y);
    return [y + (s / 6) * (k1y + 2 * k2y + 2 * k3y + k4y), d + (s / 6) * (k1d + 2 * k2d + 2 * k3d + k4d)];
  };
  ai[i0] = A0; ap[i0] = B0;
  for (let i = i0; i < n - 1; i++) { const r = rk(X0 + i * h, ai[i], ap[i], h); ai[i + 1] = r[0]; ap[i + 1] = r[1]; }
  for (let i = i0; i > 0; i--) { const r = rk(X0 + i * h, ai[i], ap[i], -h); ai[i - 1] = r[0]; ap[i - 1] = r[1]; }
  return (_airy = { h, X0, X1, n, ai, ap });
}
/** Ai(x) by cubic Hermite interpolation of the table (|error| ≲ 1e-11 on [−60, 6]); 0 beyond the right end. */
export function airy(x) {
  const T = airyTab(); if (x > T.X1 - 0.01) return 0; if (x < T.X0) return NaN;
  const f = (x - T.X0) / T.h, i = Math.min(T.n - 2, Math.floor(f)), t = f - i, h = T.h;
  const y0 = T.ai[i], y1 = T.ai[i + 1], d0 = T.ap[i] * h, d1 = T.ap[i + 1] * h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * d0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * d1;
}
/** Ai'(x) from the table (linear interpolation; used only for the zero refinement and checks). */
export function airyPrime(x) {
  const T = airyTab(); const f = (x - T.X0) / T.h, i = Math.max(0, Math.min(T.n - 2, Math.floor(f))), t = f - i;
  return T.ap[i] * (1 - t) + T.ap[i + 1] * t;
}
/** The first N zeros a_1 > a_2 > … of Ai (negative), by scanning the table for sign changes and bisecting. */
export function airyZeros(N) {
  const T = airyTab(), out = []; let prev = T.ai[Math.round(-T.X0 / T.h)], xprev = 0;
  for (let i = Math.round(-T.X0 / T.h) - 1; i >= 0 && out.length < N; i--) {
    const x = T.X0 + i * T.h, y = T.ai[i];
    if (y === 0 || y * prev < 0) {
      let lo = x, hi = xprev; for (let k = 0; k < 60; k++) { const m = 0.5 * (lo + hi); if (airy(lo) * airy(m) <= 0) hi = m; else lo = m; }
      out.push(0.5 * (lo + hi));
    }
    prev = y; xprev = x;
  }
  return out;
}

import { phaseLUT as _phaseLUT } from './ch04.shared.js';
/** Phase → [r, g, b] on the quantum kit's wheel, for raster images; rebuild per render (theme-aware). */
export function phaseRGB(v, n = 120) {
  const col = _phaseLUT(v, n), rg = col.lut.map((c) => v.rgb(c));
  const f = (phi) => rg[((Math.round((phi / TAU2) * n) % n) + n) % n];
  f.key = col.lut[0] + col.lut[n >> 2];
  return f;
}
