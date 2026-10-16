// Quantum Chemistry — Chapter 1: helpers shared by ch01.js and ch01-b.js.
// Conventions: simulations run in ħ = m = 1 unless an item says otherwise; items with real molecules use Å, u and cm⁻¹
// (ħ²/(u·Å²) = 33.715 cm⁻¹, computed below from CODATA constants) or nm, eV and fs for electrons.

export const TAU = 2 * Math.PI;

/** Uniform grid of n points on [x0, x1] (both ends included). */
export function grid(x0, x1, n) {
  const dx = (x1 - x0) / (n - 1);
  return { x: Float64Array.from({ length: n }, (_, i) => x0 + i * dx), dx, n };
}
/** ∫|ψ|² dx (Riemann sum on a uniform grid). */
export function normSq(re, im, dx) {
  let s = 0; for (let i = 0; i < re.length; i++) s += re[i] * re[i] + (im ? im[i] * im[i] : 0);
  return s * dx;
}
/** Rescale ψ in place to ∫|ψ|² = 1; returns the old norm². */
export function normalize(re, im, dx) {
  const N = normSq(re, im, dx), c = N > 0 ? 1 / Math.sqrt(N) : 0;
  for (let i = 0; i < re.length; i++) { re[i] *= c; if (im) im[i] *= c; }
  return N;
}
/** Linear interpolation of samples y on the uniform grid x at the point X (clamped). */
export function interp(x, y, X) {
  const n = x.length, f = (X - x[0]) / (x[1] - x[0]), i = Math.max(0, Math.min(n - 2, Math.floor(f))), t = f - i;
  return y[i] + t * (y[i + 1] - y[i]);
}

/** Phase → colour lookup on the quantum kit's wheel; rebuild per render (theme-aware). */
export function phaseLUT(v, n = 120) {
  const Q = v.quantum(), lut = [];
  for (let i = 0; i < n; i++) lut.push(Q.phaseColor((i / n) * TAU));
  const f = (phi) => lut[((Math.round((phi / TAU) * n) % n) + n) % n];
  f.lut = lut;
  return f;
}

/** A wave function as phase-coloured amplitude (bars from `base` to base + scale·|ψ| or |ψ|²) with an outline. */
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
    const pts = [], step = Math.max(1, Math.floor(n / 900));
    for (let i = 0; i < n; i += step) { const a = sq ? re[i] * re[i] + im[i] * im[i] : Math.hypot(re[i], im[i]); pts.push([x[i], base + scale * a]); }
    s.path(pts, { color: o.outline || 'ink', width: o.width ?? 1.5 });
  }
}
/** A real function at height `base`, signed fill (blue where > 0, orange where < 0 in the quantum wheel) with an outline. */
export function drawReal(s, x, y, o = {}) {
  const n = x.length, dx = x[1] - x[0], base = o.base ?? 0, scale = o.scale ?? 1, c = s.ctx;
  const cp = o.col ? o.col(0) : 'steelblue', cn = o.col ? o.col(Math.PI) : 'orange';
  const lo = Math.max(x[0], s.xr[0], o.domain ? o.domain[0] : -Infinity), hi = Math.min(x[n - 1], s.xr[1], o.domain ? o.domain[1] : Infinity);
  const Xa = Math.max(0, Math.ceil(s.X(lo))), Xb = Math.min(s.W, Math.floor(s.X(hi))), yb = s.Y(base);
  c.save(); c.globalAlpha = o.alpha ?? 0.5;
  for (let P = Xa; P < Xb; P++) {
    const xx = s.invX(P + 0.5), f = (xx - x[0]) / dx, i = Math.max(0, Math.min(n - 2, Math.floor(f))), t = f - i, val = y[i] + t * (y[i + 1] - y[i]);
    const yt = s.Y(base + scale * val);
    if (Math.abs(yt - yb) < 0.3) continue;
    c.fillStyle = val >= 0 ? cp : cn;
    c.fillRect(P, Math.min(yt, yb), 1.02, Math.abs(yb - yt));
  }
  c.restore();
  if (o.outline !== false) {
    const pts = [], step = Math.max(1, Math.floor(n / 900));
    for (let i = 0; i < n; i += step) if (x[i] >= lo - dx && x[i] <= hi + dx) pts.push([x[i], base + scale * y[i]]);
    s.path(pts, { color: o.outline || 'ink', width: o.width ?? 1.4, alpha: o.outlineAlpha });
  }
}
/** A small phase wheel at pixel (px, py), radius r (legend for drawPsi / drawReal). */
export function phaseWheel(s, col, px, py, r = 12, label = 'arg ψ') {
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
 * Outward Numerov integration of ψ'' = 2(V − E)ψ (ħ = m = 1) on a uniform grid of spacing h.
 * Rescales the whole solution on overflow (the shape is kept, the sign too).
 */
export function numerov(Vg, h, E, u0 = 0, u1 = 1e-6) {
  const n = Vg.length, u = new Float64Array(n), c = (h * h) / 12;
  u[0] = u0; u[1] = u1;
  let f0 = 2 * (Vg[0] - E), f1 = 2 * (Vg[1] - E);
  for (let i = 1; i < n - 1; i++) {
    const f2 = 2 * (Vg[i + 1] - E);
    u[i + 1] = (2 * u[i] * (1 + 5 * c * f1) - u[i - 1] * (1 - c * f0)) / (1 - c * f2);
    if (Math.abs(u[i + 1]) > 1e200) for (let j = 0; j <= i + 1; j++) u[j] *= 1e-200;
    f0 = f1; f1 = f2;
  }
  return u;
}
/** Sign changes of u between indices i0 and i1, ignoring values below tol × max|u|. */
export function countNodes(u, i0 = 0, i1 = u.length - 1, tol = 1e-9) {
  let mx = 0; for (let i = i0; i <= i1; i++) mx = Math.max(mx, Math.abs(u[i]));
  let k = 0, last = 0;
  for (let i = i0; i <= i1; i++) { const s = Math.abs(u[i]) <= tol * mx ? 0 : Math.sign(u[i]); if (s) { if (last && s !== last) k++; last = s; } }
  return k;
}

/**
 * Orthonormal harmonic-oscillator functions φ_0..φ_nmax at the points xi (dimensionless ξ = x/√(ħ/mω)):
 * φ_{n+1} = √(2/(n+1)) ξ φ_n − √(n/(n+1)) φ_{n−1}. Returns an array of Float64Array.
 */
export function hermiteFns(nmax, xi) {
  const N = xi.length, out = [];
  const p0 = new Float64Array(N); for (let i = 0; i < N; i++) p0[i] = Math.PI ** -0.25 * Math.exp(-0.5 * xi[i] * xi[i]);
  out.push(p0);
  if (nmax >= 1) { const p1 = new Float64Array(N); for (let i = 0; i < N; i++) p1[i] = Math.SQRT2 * xi[i] * p0[i]; out.push(p1); }
  for (let n = 1; n < nmax; n++) {
    const q = new Float64Array(N), a = Math.sqrt(2 / (n + 1)), b = Math.sqrt(n / (n + 1));
    for (let i = 0; i < N; i++) q[i] = a * xi[i] * out[n][i] - b * out[n - 1][i];
    out.push(q);
  }
  return out;
}

/** Box eigenfunction √(2/L) sin(nπx/L) on [0, L]. */
export const boxPsi = (n, L, x) => Math.sqrt(2 / L) * Math.sin((n * Math.PI * x) / L);

/**
 * Complex spherical harmonic Y_l^m(θ, φ) (Condon–Shortley phase): returns [re, im].
 * Associated Legendre functions by the standard upward recurrence in l.
 */
export function Ylm(l, m, th, ph) {
  const am = Math.abs(m), x = Math.cos(th), sx = Math.sin(th);
  let pmm = 1;
  if (am > 0) { let f = 1; for (let i = 1; i <= am; i++) { pmm *= -f * sx; f += 2; } }
  let P = pmm;
  if (l > am) {
    let p1 = x * (2 * am + 1) * pmm;
    if (l === am + 1) P = p1;
    else { let p0 = pmm; for (let ll = am + 2; ll <= l; ll++) { const p2 = ((2 * ll - 1) * x * p1 - (ll + am - 1) * p0) / (ll - am); p0 = p1; p1 = p2; } P = p1; }
  }
  let fr = 1; for (let i = l - am + 1; i <= l + am; i++) fr *= i;           // (l+|m|)!/(l−|m|)!
  let N = Math.sqrt(((2 * l + 1) / (4 * Math.PI)) / fr);
  if (m < 0) N *= (am % 2 ? -1 : 1);                                         // Y_l^{−m} = (−1)^m conj(Y_l^m)
  const a = N * P;
  return [a * Math.cos(m * ph), a * Math.sin(m * ph)];
}

/** Thousands separators. */
export const big = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** v.fix without "−0.000". */
export const fz = (v, x, d) => v.fix(Math.abs(x) < 0.5 * 10 ** -d ? 0 : x, d);
/** Subscript digits for plain-text labels. */
export const sub = (k) => String(k).replace(/[0-9]/g, (c) => '₀₁₂₃₄₅₆₇₈₉'[+c]);
/** Cycling palette names for families of curves. */
export const FAMILY = ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'red', 'gold'];

/** Unit helpers from CODATA constants (v.M.CONST). */
export function units(M) {
  const C = M.CONST;
  const hc_cm = C.h * C.c * 100;                       // J per cm⁻¹
  return {
    hc_cm,
    eV_per_cm: hc_cm / C.eV,                           // eV per cm⁻¹ (1.2398e-4)
    hbar2_uA2: C.hbar * C.hbar / (C.u * 1e-20) / hc_cm,// ħ²/(u·Å²) in cm⁻¹ (33.715)
    nm_eV: (C.h * C.c) / C.eV * 1e9,                   // hc in eV·nm (1239.84)
    boxE1: (C.h * C.h) / (8 * C.me * 1e-18) / C.eV,    // h²/8mₑ(1 nm)² in eV (0.3760)
    kT300: (C.kB * 300) / C.eV,                        // eV
  };
}
