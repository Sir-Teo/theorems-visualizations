// Quantum Mechanics — Chapter 3: helpers shared by ch03.js and ch03-b.js.
// Units in every simulation: ħ = m = 1 unless an item says otherwise, so −½ψ'' + Vψ = Eψ and k = √(2(E − V)).

export const TAU = 2 * Math.PI;

/** Uniform grid of n points on [x0, x1] (both ends included). */
export function grid(x0, x1, n) {
  const dx = (x1 - x0) / (n - 1);
  return { x: Float64Array.from({ length: n }, (_, i) => x0 + i * dx), dx, n };
}

/** Normalised Gaussian packet e^{−(x−x0)²/4σ²} e^{i k0 x} on the grid x: {re, im}. */
export function packet(x, x0, sigma, k0) {
  const n = x.length, re = new Float64Array(n), im = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.exp(-((x[i] - x0) ** 2) / (4 * sigma * sigma)), ph = k0 * (x[i] - x0);
    re[i] = a * Math.cos(ph); im[i] = a * Math.sin(ph);
  }
  normalize(re, im, x[1] - x[0]);
  return { re, im };
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
/** Probability between grid indices i0 and i1 (inclusive). */
export function probIn(re, im, dx, i0, i1) {
  let s = 0; for (let i = Math.max(0, i0); i <= Math.min(re.length - 1, i1); i++) s += re[i] * re[i] + im[i] * im[i];
  return s * dx;
}

/** Linear interpolation of samples y on the uniform grid x at the point X (clamped). */
export function interp(x, y, X) {
  const n = x.length, f = (X - x[0]) / (x[1] - x[0]), i = Math.max(0, Math.min(n - 2, Math.floor(f))), t = f - i;
  return y[i] + t * (y[i + 1] - y[i]);
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
 * A wave function as phase-coloured amplitude: per pixel column a bar from `base` to base + scale·|ψ| (mode 'abs')
 * or base + scale·|ψ|² (mode 'abs2'), filled with the colour of arg ψ, then the outline.
 * o: {col (phaseLUT), mode, scale, base, outline, width, alpha}.
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
    const pts = [], step = Math.max(1, Math.floor(n / 900));
    for (let i = 0; i < n; i += step) { const a = sq ? re[i] * re[i] + im[i] * im[i] : Math.hypot(re[i], im[i]); pts.push([x[i], base + scale * a]); }
    s.path(pts, { color: o.outline || 'ink', width: o.width ?? 1.5 });
  }
}

/**
 * A real function drawn at height `base`: signed fill, blue (phase 0) where y > 0 and orange (phase π) where y < 0 —
 * the same colours as drawPsi — with an outline. o: {col (phaseLUT), base, scale, alpha, outline, width, domain: [a, b]}.
 */
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

/** A small phase wheel at pixel position (px, py) with radius r (legend for drawPsi / drawReal). */
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
 * Energy-level diagram: V(x) shaded from below, a dashed line for each level across its classically allowed region,
 * and each eigenfunction drawn as a signed phase-coloured fill at its own energy.
 * o: {x, V (array on x), E, psi, col (phaseLUT), amp (number or i → number), show (indices), hi (index or array),
 *     label (i → string), labelColor, nodes (mark zeros), vColor}.
 */
export function levelDiagram(s, o) {
  const { x, V, E, psi, col } = o, n = x.length, [y0, y1] = s.yr, top = y1 + 4 * (y1 - y0);
  const pts = []; for (let i = 0; i < n; i++) pts.push([x[i], Math.min(V[i], top)]);
  s.clip(() => {
    s.poly([[x[0], y0 - 1], ...pts, [x[n - 1], y0 - 1]], { fill: o.vColor || 'muted', fillAlpha: 0.14, stroke: false });
    s.path(pts, { color: o.vColor || 'muted', width: 2 });
  });
  const show = o.show || E.map((_, i) => i), isHi = (i) => o.hi == null || o.hi === i || (Array.isArray(o.hi) && o.hi.includes(i));
  const amp = typeof o.amp === 'function' ? o.amp : () => o.amp ?? 1;
  for (const i of show) {
    const Ei = E[i]; if (Ei == null || Ei > y1 || Ei < y0) continue;
    let a = 0, b = n - 1; while (a < n - 1 && V[a] > Ei) a++; while (b > 0 && V[b] > Ei) b--;
    const xa = x[a], xb = x[b], h = isHi(i);
    s.line(xa, Ei, xb, Ei, { color: h ? 'ink' : 'muted', width: 1, alpha: h ? 0.55 : 0.35, dash: [4, 3] });
    if (psi && psi[i]) drawReal(s, x, psi[i], { col, base: Ei, scale: amp(i), alpha: h ? 0.55 : 0.16, outline: h ? 'ink' : 'muted', width: h ? 1.5 : 1, outlineAlpha: h ? 1 : 0.6 });
    if (o.nodes && h && psi && psi[i]) {
      const p = psi[i]; let mx = 0; for (let k = 0; k < n; k++) mx = Math.max(mx, Math.abs(p[k]));
      for (let k = 1; k < n - 1; k++) if (p[k] * p[k + 1] < 0 && Math.abs(p[k]) + Math.abs(p[k + 1]) > 1e-3 * mx) { const xz = x[k] - p[k] * (x[k + 1] - x[k]) / (p[k + 1] - p[k]); s.dot(xz, Ei, { r: 3.6, color: 'red' }); }
    }
    if (o.label) s.text(o.label(i), xb, Ei, { dx: 6, align: 'left', size: 11, color: h ? (o.labelColor || 'ink') : 'muted' });
  }
}

/**
 * Outward Numerov integration of ψ'' = 2(V − E)ψ (ħ = m = 1) on a uniform grid of spacing h.
 * Vg: potential at the nodes; u0, u1: the first two values. Rescales the whole solution on overflow (the shape is kept).
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
/** Number of sign changes of u between indices i0 and i1, ignoring values below tol × max|u| (rounding near the walls). */
export function countNodes(u, i0 = 0, i1 = u.length - 1, tol = 1e-9) {
  let mx = 0; for (let i = i0; i <= i1; i++) mx = Math.max(mx, Math.abs(u[i]));
  let k = 0, last = 0;
  for (let i = i0; i <= i1; i++) { const s = Math.abs(u[i]) <= tol * mx ? 0 : Math.sign(u[i]); if (s) { if (last && s !== last) k++; last = s; } }
  return k;
}

// ------------------------------------------------------------------ transfer matrices (ħ = m = 1)
// A slab of constant V and length d carries (ψ, ψ') by the real matrix [[cos kd, sin kd / k], [−k sin kd, cos kd]]
// (cosh/sinh when E < V); det = 1 (the Wronskian). Matrices are flat arrays [a, b, c, d].

/** (ψ, ψ') transfer matrix of a slab with k² = 2(E − V) and length d (d may be negative: the inverse). */
export function slab(k2, d) {
  if (k2 > 1e-12) { const k = Math.sqrt(k2), c = Math.cos(k * d), s = Math.sin(k * d); return [c, s / k, -k * s, c]; }
  if (k2 < -1e-12) { const q = Math.sqrt(-k2), c = Math.cosh(q * d), s = Math.sinh(q * d); return [c, s / q, q * s, c]; }
  return [1, d, k2 * d, 1];
}
/** 2×2 product A·B of flat matrices. */
export const mul2 = (A, B) => [A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3], A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3]];
/** Total matrix of a stack of slabs segs = [{V, d}, …] (left to right) at energy E. */
export function stackMatrix(E, segs) {
  let P = [1, 0, 0, 1];
  for (const s of segs) P = mul2(slab(2 * (E - s.V), s.d), P);
  return P;
}
/** Slice a potential V(x) on [a, b] into n slabs of equal width (midpoint values). */
export function sliceV(V, a, b, n) {
  const d = (b - a) / n, out = [];
  for (let i = 0; i < n; i++) out.push({ V: V(a + (i + 0.5) * d), d });
  return out;
}
/**
 * Scattering by a stack: incident e^{ik_L x} + r e^{−ik_L x} on the left (potential VL), t e^{ik_R x} on the right (VR).
 * From P [1 + r, ik_L(1 − r)] = t [1, ik_R]: t = 2ik_L/D with D = k_L k_R b − c + i(k_R a + k_L d), so
 * T = (k_R/k_L)|t|² = 4k_L k_R/|D|² with no cancellation even for tiny T. Below the right edge (E < VR): T = 0, |r| = 1.
 * Returns {T, R, t: [re, im], r: [re, im], kL, kR, kappaR, P} (null if E ≤ VL).
 */
export function scatter(E, segs, VL = 0, VR = 0) {
  const kL2 = 2 * (E - VL), kR2 = 2 * (E - VR); if (!(kL2 > 0)) return null;
  const kL = Math.sqrt(kL2), P = stackMatrix(E, segs), [a, b, c, d] = P;
  if (kR2 > 0) {
    const kR = Math.sqrt(kR2), Dr = kL * kR * b - c, Di = kR * a + kL * d, D2 = Dr * Dr + Di * Di;
    const Nr = -c - kL * kR * b, Ni = kR * a - kL * d;
    return { T: (4 * kL * kR) / D2, R: (Nr * Nr + Ni * Ni) / D2, t: [(2 * kL * Di) / D2, (2 * kL * Dr) / D2], r: [(Nr * Dr + Ni * Di) / D2, (Ni * Dr - Nr * Di) / D2], kL, kR, kappaR: 0, P };
  }
  const q = Math.sqrt(-kR2), al = c + q * a, B = kL * (d + q * b), den = al * al + B * B;
  const r = [-(al * al - B * B) / den, (-2 * al * B) / den];
  const t = [a * (1 + r[0]) + kL * b * r[1], a * r[1] + kL * b * (1 - r[0])]; // a(1+r) + ik_L b(1−r)
  return { T: 0, R: 1, t, r, kL, kR: 0, kappaR: q, P };
}
/**
 * The stationary scattering state of a stack starting at x0, sampled at the points xs: {re, im, dre, dim} (ψ and ψ'),
 * obtained by propagating t·(1, ik_R) backward from the right edge (the stable direction through barriers).
 */
export function scatterWave(E, segs, x0, xs, VL = 0, VR = 0) {
  const S = scatter(E, segs, VL, VR); if (!S) return null;
  const n = segs.length, xb = [x0]; for (const s of segs) xb.push(xb[xb.length - 1] + s.d);
  const st = new Array(n + 1);
  const tr = S.t[0], ti = S.t[1];
  st[n] = S.kR > 0 ? [tr, ti, -S.kR * ti, S.kR * tr] : [tr, ti, -S.kappaR * tr, -S.kappaR * ti]; // ψ re, ψ im, ψ' re, ψ' im
  const app = (M, v) => [M[0] * v[0] + M[1] * v[2], M[0] * v[1] + M[1] * v[3], M[2] * v[0] + M[3] * v[2], M[2] * v[1] + M[3] * v[3]];
  for (let j = n - 1; j >= 0; j--) st[j] = app(slab(2 * (E - segs[j].V), -segs[j].d), st[j + 1]);
  const m = xs.length, re = new Float64Array(m), im = new Float64Array(m), dre = new Float64Array(m), dim = new Float64Array(m);
  const kL = S.kL, [rr, ri] = S.r;
  for (let i = 0; i < m; i++) {
    const X = xs[i]; let w;
    if (X <= x0) {
      const ph = kL * (X - x0), c = Math.cos(ph), s = Math.sin(ph);
      const er = c, ei = s, fr = rr * c + ri * s, fi = ri * c - rr * s; // e^{ikx}, r e^{−ikx}
      w = [er + fr, ei + fi, -kL * (ei - fi), kL * (er - fr)];
    } else if (X >= xb[n]) {
      const u = X - xb[n];
      if (S.kR > 0) { const c = Math.cos(S.kR * u), s = Math.sin(S.kR * u), pr = tr * c - ti * s, pi = tr * s + ti * c; w = [pr, pi, -S.kR * pi, S.kR * pr]; }
      else { const e = Math.exp(-S.kappaR * u); w = [tr * e, ti * e, -S.kappaR * tr * e, -S.kappaR * ti * e]; }
    } else {
      let lo = 0, hi = n; while (hi - lo > 1) { const md = (lo + hi) >> 1; if (xb[md] <= X) lo = md; else hi = md; }
      w = app(slab(2 * (E - segs[lo].V), X - xb[lo + 1]), st[lo + 1]);
    }
    re[i] = w[0]; im[i] = w[1]; dre[i] = w[2]; dim[i] = w[3];
  }
  return { re, im, dre, dim, ...S, xb, st };
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
/** v.fix without a "−0.000": values that round to zero print as 0. */
export const fz = (v, x, d) => v.fix(Math.abs(x) < 0.5 * 10 ** -d ? 0 : x, d);
/** Subscript digits for plain-text labels (12 → ₁₂). */
export const sub = (k) => String(k).replace(/[0-9]/g, (c) => '₀₁₂₃₄₅₆₇₈₉'[+c]);
/** Cycling palette names for families of curves. */
export const FAMILY = ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'red', 'gold'];
