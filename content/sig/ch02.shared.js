// Signals & Systems — Chapter 2 shared helpers: a "lab bench" of systems acting on sampled signals, tests of the six
// system properties by their definitions, and drawing helpers (stems, drawable signals, block-diagram pieces).

export const TAU = 2 * Math.PI;

// ================================================================ the bench grid
// Continuous time is simulated on a fine uniform grid t_i = T0 + i·DT on [T0, T1]. Every signal is at rest (zero) before
// T0, which is far to the left of anything the pictures show, so integrators and filters start from rest.
export const T0 = -16, T1 = 16, DT = 0.01, NG = 3200;
/** The window the pictures and the tests look at. */
export const VIEW = [-5, 5];
export const tOf = (i) => T0 + i * DT;
export const iOf = (t) => Math.round((t - T0) / DT);
export const I0 = iOf(VIEW[0]), I1 = iOf(VIEW[1]);

/** Sample a function of t on the bench grid. */
export function sample(f) { const a = new Float64Array(NG + 1); for (let i = 0; i <= NG; i++) a[i] = f(tOf(i)); return a; }
/** Sample j of xs, with rest (0) before the grid and the last value held after it. */
export const get = (xs, j) => (j < 0 ? 0 : j > NG ? xs[NG] : xs[j]);
/** a·xs + b·ys. */
export function combo(a, xs, b, ys) { const o = new Float64Array(NG + 1); for (let i = 0; i <= NG; i++) o[i] = a * xs[i] + b * ys[i]; return o; }
/** x(t − kΔt): shift right by k samples. */
export function shiftBy(xs, k) { const o = new Float64Array(NG + 1); for (let i = 0; i <= NG; i++) o[i] = get(xs, i - k); return o; }
export function maxDiff(a, b, i0 = I0, i1 = I1) { let m = 0; for (let i = i0; i <= i1; i++) { const d = Math.abs(a[i] - b[i]); if (!(d <= m)) m = d; } return m; }
export function maxAbs(a, i0 = I0, i1 = I1) { let m = 0; for (let i = i0; i <= i1; i++) { const d = Math.abs(a[i]); if (!(d <= m)) m = d; } return m; }
/** [[t, y]] points of a sampled signal on [a, b] (null where it is not finite), for s.path. */
export function pts(ys, a = VIEW[0], b = VIEW[1], step = 1) {
  const out = [];
  for (let i = Math.max(0, iOf(a)); i <= Math.min(NG, iOf(b)); i += step) out.push(isFinite(ys[i]) ? [tOf(i), ys[i]] : null);
  return out;
}
/** Raised-cosine bump of half-width w centred at c (exactly zero outside (c − w, c + w)). */
export const bump = (t, c, w) => (Math.abs(t - c) < w ? Math.cos((Math.PI * (t - c)) / (2 * w)) ** 2 : 0);
/** Smooth ramp from 0 (u ≤ −1) to 1 (u ≥ 1). */
export const ramp = (u) => (u <= -1 ? 0 : u >= 1 ? 1 : (1 + Math.sin((Math.PI * u) / 2)) / 2);

/** Small seeded generator (mulberry32) so that tests are reproducible. */
export function rand(seed) {
  let a = (seed >>> 0) || 1;
  const r = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.u = (lo, hi) => lo + (hi - lo) * r();
  r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  r.pm = () => (r() < 0.5 ? -1 : 1);
  return r;
}

/** A random smooth test signal: a few bumps (and sometimes a ramp that persists), at rest before t = −5.5. */
export function randomSignal(r, amp = 1) {
  const parts = [], n = r.int(3, 5);
  for (let k = 0; k < n; k++) parts.push([r.u(-3.8, 3.8), r.u(0.45, 1.4), amp * r.u(-1, 1)]);
  const st = r() < 0.4 ? [r.u(-3, 3), r.u(0.3, 1), amp * r.u(-0.7, 0.7)] : null;
  return sample((t) => { let s = 0; for (const [c, w, A] of parts) s += A * bump(t, c, w); if (st) s += st[2] * ramp((t - st[0]) / st[1]); return s; });
}
/** A random ±1 switching ("telegraph") signal, switched on at t = −4.8. */
export function telegraph(r) {
  const sw = []; let t = -4.8, s = r.pm();
  while (t < T1) { sw.push([t, s]); t += r.u(0.25, 1.3); s = -s; }
  let k = 0;
  return sample((t2) => { if (t2 < -4.8) return 0; while (k + 1 < sw.length && sw[k + 1][0] <= t2) k++; return sw[k][1]; });
}

// ================================================================ building blocks
const mapPt = (xs, f) => { const y = new Float64Array(NG + 1); for (let i = 0; i <= NG; i++) y[i] = f(xs[i], tOf(i), i); return y; };
const reindex = (xs, J) => { const y = new Float64Array(NG + 1); for (let i = 0; i <= NG; i++) y[i] = get(xs, J(i)); return y; };
/** Running integral (rectangle rule): X_i = Δt·Σ_{j≤i} x_j — the accumulator. */
export function cumsum(xs) { const X = new Float64Array(NG + 1); let s = 0; for (let i = 0; i <= NG; i++) { s += DT * xs[i]; X[i] = s; } return X; }
/** Its exact inverse, the first difference divided by Δt. */
export function diff(X) { const x = new Float64Array(NG + 1); for (let i = 0; i <= NG; i++) x[i] = (X[i] - (i ? X[i - 1] : 0)) / DT; return x; }
/**
 * y' = p·y + k·x from rest, exact when x is held constant on each step (t_{i−1}, t_i]: y_i = a·y_{i−1} + c·x_i,
 * a = e^{pΔt}, c = k(a − 1)/p (and c = kΔt when p = 0: the accumulator).
 */
export function fo(p, k = 1) { const a = Math.exp(p * DT), c = Math.abs(p * DT) < 1e-12 ? k * DT : (k * (a - 1)) / p; return { a, c }; }
export function firstOrder(xs, p, k = 1) { const { a, c } = fo(p, k), y = new Float64Array(NG + 1); let s = 0; for (let i = 0; i <= NG; i++) { s = a * s + c * xs[i]; y[i] = s; } return y; }
export function unFirstOrder(ys, p, k = 1) { const { a, c } = fo(p, k), x = new Float64Array(NG + 1); for (let i = 0; i <= NG; i++) x[i] = (ys[i] - a * (i ? ys[i - 1] : 0)) / c; return x; }
const M_AVG = 100, W_AVG = M_AVG * DT; // averaging window: 1 time unit
/** Mean of x over the window [t − 1 + lead, t + lead] (lead = 0: trailing average; lead = ½: centred). */
function movAvg(xs, lead) { const X = cumsum(xs), y = new Float64Array(NG + 1); for (let i = 0; i <= NG; i++) y[i] = (get(X, i + lead) - get(X, i + lead - M_AVG)) / W_AVG; return y; }
/** Undo it from rest: X(t + lead) = W·y(t) + X(t + lead − W), then x = X′. */
function unMovAvg(ys, lead) { const X = new Float64Array(NG + 1); for (let j = 0; j <= NG; j++) X[j] = W_AVG * get(ys, j - lead) + (j - M_AVG >= 0 ? X[j - M_AVG] : 0); return diff(X); }
export const carrier = (t) => Math.cos(TAU * t);
export const gateOn = (t) => ((t % 1) + 1) % 1 < 0.5;
const interpAt = (ys, u) => { const j = Math.floor(u), f = u - j; return get(ys, j) * (1 - f) + get(ys, j + 1) * f; };
const stepAt = (c) => sample((t) => (t >= c ? 1 : 0));

/**
 * The systems on the bench. Each has run(xs) → ys on the bench grid; invertible ones carry inverse(ys) → xs, and
 * non-invertible ones pair(xs, r) → a different input with the same output. Stable ones carry bound(B), the largest
 * |y| a bounded input |x| ≤ B can produce; unstable ones a blowup witness (a bounded input whose output grows).
 */
export const SYS = {
  gain: { label: 'amplifier', short: 'amplifier ×2', tex: 'y(t)=2\\,x(t)', run: (x) => mapPt(x, (v) => 2 * v), inverse: (y) => mapPt(y, (v) => v / 2), invTex: 'x(t)=y(t)/2', bound: (B) => 2 * B },
  square: { label: 'squarer', short: 'squarer', tex: 'y(t)=x(t)^2', run: (x) => mapPt(x, (v) => v * v), pair: (x) => mapPt(x, (v) => -v), pairTex: "x'(t)=-x(t)", bound: (B) => B * B },
  cube: { label: 'cuber', short: 'cuber', tex: 'y(t)=x(t)^3', run: (x) => mapPt(x, (v) => v * v * v), inverse: (y) => mapPt(y, Math.cbrt), invTex: 'x(t)=\\sqrt[3]{y(t)}', bound: (B) => B ** 3 },
  delay: { label: 'delay', short: 'delay by 1', tex: 'y(t)=x(t-1)', run: (x) => reindex(x, (i) => i - 100), inverse: (y) => reindex(y, (i) => i + 100), invTex: 'x(t)=y(t+1)', bound: (B) => B },
  reverse: { label: 'time reversal', short: 'time reversal', tex: 'y(t)=x(-t)', run: (x) => reindex(x, (i) => NG - i), inverse: (y) => reindex(y, (i) => NG - i), invTex: 'x(t)=y(-t)', bound: (B) => B },
  mavg: { label: 'moving average', short: 'moving average', tex: 'y(t)=\\int_{t-1}^{t}x(s)\\,ds', run: (x) => movAvg(x, 0), inverse: (y) => unMovAvg(y, 0), invTex: "x(t)=y'(t)+x(t-1)", bound: (B) => B, invNote: 'a recursion that starts from rest' },
  accum: {
    label: 'accumulator', short: 'accumulator', tex: 'y(t)=\\int_{-\\infty}^{t}x(s)\\,ds', run: cumsum, inverse: diff, invTex: "x(t)=y'(t)",
    blowup: { x: () => stepAt(-4), xTex: 'x(t)=u(t+4)', yTex: 'y(t)=t+4', grow: (M) => M - 4, desc: 'the output is the ramp $t+4$, which passes every bound $M$ at $t=M-4$' },
  },
  mod: { label: 'modulator', short: 'modulator', tex: 'y(t)=x(t)\\cos 2\\pi t', run: (x) => mapPt(x, (v, t) => v * carrier(t)), inverse: (y) => mapPt(y, (v, t) => v / carrier(t)), invTex: 'x(t)=y(t)/\\cos 2\\pi t', bound: (B) => B, invNote: 'division by the carrier, by continuity at its zeros' },
  clip: {
    label: 'clipper', short: 'clipper ±1', tex: 'y(t)=\\max(-1,\\min(1,x(t)))', run: (x) => mapPt(x, (v) => Math.max(-1, Math.min(1, v))),
    pair: (x) => mapPt(x, (v) => v + 0.6 * Math.max(0, v - 1) - 0.6 * Math.max(0, -1 - v)), pairTex: "x'=x \\text{ pushed further past }\\pm1", pairAmp: 1.7, bound: (B) => Math.min(B, 1),
  },
  rc: { label: 'RC filter', short: 'RC filter', tex: "y'(t)+y(t)=x(t)", run: (x) => firstOrder(x, -1, 1), inverse: (y) => unFirstOrder(y, -1, 1), invTex: "x(t)=y'(t)+y(t)", bound: (B) => B },
  affine: { label: 'affine', short: 'affine 2x+1', tex: 'y(t)=2x(t)+1', run: (x) => mapPt(x, (v) => 2 * v + 1), inverse: (y) => mapPt(y, (v) => (v - 1) / 2), invTex: 'x(t)=(y(t)-1)/2', bound: (B) => 2 * B + 1 },
  tx: {
    label: 'time-varying gain', short: 'gain t·x', tex: 'y(t)=t\\,x(t)', run: (x) => mapPt(x, (v, t) => t * v),
    inverse: (y) => mapPt(y, (v, t, i) => (Math.abs(t) < 1e-9 ? (get(y, i + 1) / tOf(i + 1) + get(y, i - 1) / tOf(i - 1)) / 2 : v / t)), invTex: 'x(t)=y(t)/t', invNote: 'division by $t$, by continuity at $t=0$',
    blowup: { x: () => stepAt(-4), xTex: 'x(t)=u(t+4)', yTex: 'y(t)=t', grow: (M) => M, desc: 'the output is $t$ itself for $t\\ge-4$, which passes every bound $M$ at $t=M$' },
  },
  compress: { label: 'compressor', short: 'compressor x(2t)', tex: 'y(t)=x(2t)', run: (x) => reindex(x, (i) => 2 * i - iOf(0)), inverse: (y) => mapPt(y, (v, t, i) => interpAt(y, (i + iOf(0)) / 2)), invTex: 'x(t)=y(t/2)', invTol: 5e-3, bound: (B) => B, invNote: 'read $y$ at $t/2$ (between grid points by interpolation)' },
  advance: { label: 'advance', short: 'advance by 1', tex: 'y(t)=x(t+1)', run: (x) => reindex(x, (i) => i + 100), inverse: (y) => reindex(y, (i) => i - 100), invTex: 'x(t)=y(t-1)', bound: (B) => B },
  cavg: { label: 'centred average', short: 'centred average', tex: 'y(t)=\\int_{t-1/2}^{t+1/2}x(s)\\,ds', run: (x) => movAvg(x, 50), inverse: (y) => unMovAvg(y, 50), invTex: "x(t+\\tfrac12)=y'(t)+x(t-\\tfrac12)", bound: (B) => B, invNote: 'a recursion that starts from rest' },
  gate: {
    label: 'chopper', short: 'chopper (on/off)', tex: 'y(t)=x(t)\\,g(t)', run: (x) => mapPt(x, (v, t) => (gateOn(t) ? v : 0)),
    pair: (x, r) => { const c = []; for (let k = -4; k <= 4; k++) if (r() < 0.6) c.push([k + 0.75, r.u(0.4, 1) * r.pm()]); if (!c.length) c.push([0.75, 0.8]); return mapPt(x, (v, t) => v + c.reduce((s, [m, A]) => s + A * bump(t, m, 0.22), 0)); },
    pairTex: "x'=x+\\text{bumps while the switch is open}", bound: (B) => B,
  },
};
for (const [id, s] of Object.entries(SYS)) s.id = id;
/** Compact menu labels (TeX where a formula is shorter than a name). */
export const MENU = {
  gain: '$2x$', square: '$x^2$', cube: '$x^3$', delay: '$x(t-1)$', reverse: '$x(-t)$', mavg: 'average', accum: 'accumulator', mod: 'modulator',
  clip: 'clipper', rc: 'RC filter', affine: '$2x+1$', tx: '$t\\,x(t)$', compress: '$x(2t)$', advance: '$x(t+1)$', cavg: 'centred avg.', gate: 'chopper', custom: 'yours',
};
export const menu = (ids) => ids.map((id) => ({ value: id, label: MENU[id] }));
/** Starting shapes for drawn inputs (all at rest before t = −4.8). */
const NOISE = (() => { const r = rand(5), v = []; for (let k = 0; k <= 60; k++) v.push(r.u(-1, 1)); return v; })();
export const SHAPES = {
  pulse: { label: 'pulse', f: (t) => (t >= -2.5 && t < -0.5 ? 1 : t >= -0.5 && t < 1.5 ? (1.5 - t) / 2 : 0) },
  wiggle: { label: 'wiggle', f: (t) => 0.9 * bump(t, -2.3, 1.1) - 0.7 * bump(t, -0.3, 0.8) + 1.15 * bump(t, 1.8, 1.4) },
  step: { label: 'step', f: (t) => (t >= -3 ? 1 : 0) },
  sine: { label: 'sinusoid', f: (t) => (t >= -4.5 ? Math.sin((TAU * (t + 4.5)) / 3) : 0) },
  noise: { label: 'noise', f: (t) => { if (t < -4.5) return 0; const u = (t + 4.5) / 0.25, k = Math.min(59, Math.floor(u)), f = u - k; return 0.8 * (NOISE[k] * (1 - f) + NOISE[k + 1] * f) * Math.min(1, (t + 4.5) / 0.25); } },
};
export const shapeMenu = (ids = Object.keys(SHAPES)) => ids.map((value) => ({ value, label: SHAPES[value].label }));
/**
 * The system picked in a menu, with 'custom' compiled from a formula field (rebuilt only when the text changes).
 * → () => system.
 */
export function picker(sel, field) {
  let cur = { src: null, sys: null };
  return () => {
    if (sel.value !== 'custom') return SYS[sel.value];
    if (field && field.fn && field.value !== cur.src) cur = { src: field.value, sys: makeCustom(field.fn, field.value) };
    return cur.sys || SYS.gain;
  };
}
/** How to name a system in a readout: its formula as TeX, or the typed formula as plain text. */
export const sysTex = (sys) => (sys.custom ? `y = ${String(sys.src).replace(/\*/g, '·')}` : `$${sys.tex}$`);

/** The six properties, in table order. */
export const PROPS = [
  { id: 'lin', name: 'linear', short: 'linear' },
  { id: 'ti', name: 'time-invariant', short: 'time-inv.' },
  { id: 'causal', name: 'causal', short: 'causal' },
  { id: 'mless', name: 'memoryless', short: 'memoryless' },
  { id: 'inv', name: 'invertible', short: 'invertible' },
  { id: 'stable', name: 'BIBO stable', short: 'stable' },
];

// ================================================================ a system typed by the reader
/**
 * y(t) = f(x(t), t, x(t − 1), x(t + 1)) from a formula in the variables x, t, xd (= x(t−1)) and xa (= x(t+1)).
 * Pointwise in its arguments, so stability and invertibility can be probed directly on f.
 */
export function makeCustom(f, src) {
  const ok = (v) => (isFinite(v) ? v : NaN);
  const run = (xs) => { const y = new Float64Array(NG + 1); for (let i = 0; i <= NG; i++) y[i] = ok(f(xs[i], tOf(i), get(xs, i - 100), get(xs, i + 100))); return y; };
  const A7 = [-1, -0.5, -1e-6, 0, 1e-6, 0.5, 1], TS = [0, 0.37, -0.37, 1, -1, 3, -3, 10, -10, 30, -30, 100, -100, 1e3, -1e3, 1e4, -1e4];
  const dep = (k) => { for (const a of [-1, 0.3, 1]) for (const t of [-2, 0.7, 3]) { const base = [a, t, 0.4, -0.6], alt = base.slice(); alt[k] += 0.9; if (Math.abs(ok(f(...base)) - ok(f(...alt))) > 1e-12) return true; } return false; };
  const usesX = dep(0), usesD = dep(2), usesA = dep(3);
  const A = usesD || usesA ? A7 : [...Array.from({ length: 201 }, (_, k) => -1 + k / 100), -1e-9, 1e-9];
  // stability probe: sup of |f| over bounded arguments, as |t| grows
  let worst = { m: 0 }, near = 0, bad = null;
  for (const t of TS) for (const a of A) for (const b of usesD ? A : [0]) for (const c of usesA ? A : [0]) {
    const v = f(a, t, b, c);
    if (!isFinite(v)) { bad ??= { a, t, b, c }; continue; }
    if (Math.abs(v) > worst.m) worst = { m: Math.abs(v), a, t, b, c };
    if (Math.abs(t) <= 10) near = Math.max(near, Math.abs(v));
  }
  const stable = !bad && worst.m <= 20 * Math.max(1, near) && worst.m < 1e8;
  // invertibility probe
  let even = true, mono = !usesD && !usesA && usesX;
  for (const t of [-4, -1.3, 0.5, 2.7]) {
    for (const a of [0.2, 0.7, 1.3, 2.1]) if (Math.abs(ok(f(a, t, 0.3 * a, -0.5 * a)) - ok(f(-a, t, -0.3 * a, 0.5 * a))) > 1e-10 * (1 + Math.abs(ok(f(a, t, 0.3 * a, -0.5 * a))))) even = false;
    if (mono) { let sgn = 0; for (let k = 0; k < 120; k++) { const a = -3 + k * 0.05, d = ok(f(a + 0.05, t, 0, 0)) - ok(f(a, t, 0, 0)); if (!(Math.abs(d) > 1e-12)) { mono = false; break; } const s = Math.sign(d); if (sgn && s !== sgn) { mono = false; break; } sgn = s; } }
  }
  const sys = { id: 'custom', label: 'your system', short: 'your system', tex: null, src, custom: true, run, usesX, usesD, usesA };
  if (!stable) {
    const w = bad || worst;
    sys.blowup = { probe: true, w, x: () => sample((t) => (t >= -4.8 ? w.a : 0)), desc: bad ? `the formula is infinite or undefined at $x=${fmtN(w.a)}$, $t=${fmtN(w.t)}$` : `with the constant input $x=${fmtN(w.a)}$ the output reaches $|y|$ = ${fmtN(worst.m)} at $t=${fmtN(w.t)}$ (and only ${fmtN(near)} while $|t|\\le10$)` };
  } else sys.bound = () => worst.m; // probed sup over |x| ≤ 1 (the tests use B = 1)
  if (!usesX) sys.pair = (x) => combo(1, x, 0, x).map((v) => v + 0.8), sys.pairTex = "x'=x+0.8";
  else if (even) sys.pair = (x) => combo(-1, x, 0, x), sys.pairTex = "x'=-x";
  else if (mono) {
    sys.inverse = (ys) => {
      const x = new Float64Array(NG + 1);
      for (let i = 0; i <= NG; i++) {
        const t = tOf(i), g = (a) => ok(f(a, t, 0, 0)) - ys[i]; let lo = -50, hi = 50;
        if (!(Math.abs(g(hi) - g(lo)) > 1e-12)) { x[i] = NaN; continue; } // f(·, t) is flat here: x(t) is lost at this instant
        const up = g(hi) > g(lo);
        for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if ((g(m) > 0) === up) hi = m; else lo = m; }
        x[i] = (lo + hi) / 2;
      }
      for (let i = 0; i <= NG; i++) if (Number.isNaN(x[i])) x[i] = ((i ? x[i - 1] : 0) + (i < NG && !Number.isNaN(x[i + 1]) ? x[i + 1] : i ? x[i - 1] : 0)) / 2; // by continuity
      return x;
    };
    sys.invTex = '\\text{solve } f(x,t)=y \\text{ for } x'; sys.invTol = 1e-4;
  }
  return sys;
}
const fmtN = (x) => { const a = Math.abs(x); return (a !== 0 && (a < 1e-3 || a >= 1e5) ? x.toExponential(1) : String(+x.toPrecision(3))).replace('-', '−'); };

// ================================================================ the tests, each straight from a definition
const TOL = 1e-9;
const scaleOf = (...arrs) => Math.max(1, ...arrs.map((a) => maxAbs(a)));
const ok = (err, sc, tol = TOL) => err <= tol * sc; // false for NaN
/** Are all these outputs finite on the window? (A typed formula may divide by zero.) */
const finite = (...arrs) => arrs.every((a) => { for (let i = I0; i <= I1; i++) if (!isFinite(a[i])) return false; return true; });
const undef = (prop) => ({ prop, nan: true, pass: null });

/** Linearity: S(a·x₁ + b·x₂) against a·S(x₁) + b·S(x₂) for random inputs and coefficients. */
export function testLin(sys, seed = 1) {
  const r = rand(seed * 7 + 1); let last = null;
  for (const amp of [0.6, 1.1, 1.7, 2.4]) {
    const x1 = randomSignal(r, amp), x2 = randomSignal(r, amp), a = r.pm() * r.u(0.5, 2), b = r.pm() * r.u(0.4, 1.6);
    const y1 = sys.run(x1), y2 = sys.run(x2), lhs = sys.run(combo(a, x1, b, x2)), rhs = combo(a, y1, b, y2);
    if (!finite(y1, y2, lhs)) return undef('lin');
    const err = maxDiff(lhs, rhs), sc = scaleOf(lhs, rhs);
    last = { prop: 'lin', x1, x2, a, b, y1, y2, lhs, rhs, err, sc, pass: ok(err, sc) };
    if (!last.pass) return last;
  }
  return last;
}
/** Time invariance: S applied to x(t − τ) against S(x) delayed by τ. */
export function testTI(sys, seed = 1) {
  const r = rand(seed * 7 + 2); let last = null;
  for (const amp of [0.8, 1.3, 1.9]) {
    const x = randomSignal(r, amp), k = r.pm() * Math.round(r.u(80, 250)), xs = shiftBy(x, k);
    const y = sys.run(x), lhs = sys.run(xs), rhs = shiftBy(y, k);
    if (!finite(y, lhs)) return undef('ti');
    const err = maxDiff(lhs, rhs), sc = scaleOf(lhs, rhs);
    last = { prop: 'ti', x, xs, tau: k * DT, y, lhs, rhs, err, sc, pass: ok(err, sc) };
    if (!last.pass) return last;
  }
  return last;
}
/** Causality: two inputs that agree up to t₀ must give outputs that agree up to t₀. */
export function testCausal(sys, seed = 1) {
  const r = rand(seed * 7 + 3); let last = null;
  for (const t0g of [-1.5, 0.6, 2.2, r.u(-2, 3)]) {
    const t0 = iOf(t0g) * DT + T0, w = r.u(0.4, 1), A = r.pm() * r.u(0.6, 1.2);
    const x1 = randomSignal(r, 1), p = sample((t) => A * bump(t, t0 + w, w)), x2 = combo(1, x1, 1, p);
    const y1 = sys.run(x1), y2 = sys.run(x2), i0 = iOf(t0), sc = scaleOf(y1, y2);
    if (!finite(y1, y2)) return undef('causal');
    let err = 0, first = null;
    for (let i = I0; i <= i0; i++) { const d = Math.abs(y1[i] - y2[i]); if (!(d <= err)) err = d; if (first == null && !(d <= TOL * sc)) first = i; }
    last = { prop: 'causal', t0, x1, x2, y1, y2, err, sc, first: first == null ? null : tOf(first), pass: ok(err, sc) };
    if (!last.pass) return last;
  }
  return last;
}
/** Memorylessness: wherever two inputs agree, the outputs must agree, however different the inputs are elsewhere. */
export function testMless(sys, seed = 1) {
  const r = rand(seed * 7 + 4); let last = null;
  for (let k = 0; k < 3; k++) {
    const x1 = randomSignal(r, 1), c1 = r.u(-3.6, -0.6), c2 = r.u(0.6, 3.6), A1 = r.pm() * r.u(0.5, 1), A2 = r.pm() * r.u(0.5, 1);
    const q = sample((t) => A1 * bump(t, c1, 0.6) + A2 * bump(t, c2, 0.6)), x2 = combo(1, x1, 1, q);
    const y1 = sys.run(x1), y2 = sys.run(x2), sc = scaleOf(y1, y2);
    if (!finite(y1, y2)) return undef('mless');
    let err = 0, at = null;
    for (let i = I0; i <= I1; i++) if (q[i] === 0) { const d = Math.abs(y1[i] - y2[i]); if (!(d <= err)) { err = d; at = i; } }
    last = { prop: 'mless', x1, x2, q, y1, y2, err, sc, at: at == null ? null : tOf(at), pass: ok(err, sc) };
    if (!last.pass) return last;
  }
  return last;
}
/** Invertibility: either two different inputs with one output (not invertible), or an inverse that recovers the input. */
export function testInv(sys, seed = 1) {
  const r = rand(seed * 7 + 5);
  if (sys.pair) {
    const x1 = randomSignal(r, sys.pairAmp ?? 1.2), x2 = sys.pair(x1, r), y1 = sys.run(x1), y2 = sys.run(x2);
    if (!finite(y1, y2)) return undef('inv');
    const dIn = maxDiff(x1, x2), dOut = maxDiff(y1, y2, 0, NG), sc = scaleOf(y1, y2);
    if (dIn > 1e-3 && ok(dOut, sc)) return { prop: 'inv', kind: 'pair', x1, x2, y1, y2, dIn, dOut, pass: false };
  }
  if (sys.inverse) {
    const x = randomSignal(r, 1.2), y = sys.run(x);
    if (!finite(y)) return undef('inv');
    const xr = sys.inverse(y), err = maxDiff(x, xr), sc = scaleOf(x);
    return { prop: 'inv', kind: 'inverse', x, y, xr, err, sc, pass: ok(err, sc, sys.invTol ?? 1e-7) ? true : null };
  }
  return { prop: 'inv', kind: 'none', pass: null };
}
/** BIBO stability: bounded inputs (|x| ≤ 1) against the bound, or a bounded input whose output grows without limit. */
export function testStable(sys, seed = 1) {
  const r = rand(seed * 7 + 6);
  if (sys.blowup) {
    const x = sys.blowup.x(), y = sys.run(x);
    return { prop: 'stable', kind: 'blowup', x, y, B: maxAbs(x, 0, NG), sup: maxAbs(y), desc: sys.blowup.desc, pass: false };
  }
  const K = sys.bound ? sys.bound(1) : null, ins = [];
  ins.push(['a random ±1 switching signal', telegraph(r)]);
  ins.push(['the step $u(t+4.5)$', stepAt(-4.5)]);
  ins.push(['a switched-on sinusoid', sample((t) => (t >= -4.5 ? Math.sin(2.3 * (t + 4.5)) : 0))]);
  const rs = randomSignal(r, 1), m = maxAbs(rs, 0, NG) || 1; ins.push(['a random smooth signal', rs.map((v) => v / m)]);
  let best = null;
  for (const [name, x] of ins) { const y = sys.run(x), s = maxAbs(y); if (!best || !(s <= best.sup)) best = { name, x, y, sup: s }; }
  if (sys.custom) return { prop: 'stable', kind: 'bound', ...best, B: 1, K: Math.max(K, best.sup), probe: true, pass: true };
  const pass = K == null ? null : best.sup <= K + 1e-9 * Math.max(1, K);
  return { prop: 'stable', kind: 'bound', ...best, B: 1, K, pass };
}
export const TESTS = { lin: testLin, ti: testTI, causal: testCausal, mless: testMless, inv: testInv, stable: testStable };

// ================================================================ drawing helpers
/** Stem plot of [[n, x], …]: a thin line from the baseline to each value, capped with a dot (smaller when stems crowd). */
export function stems(s, P, st = {}) {
  const col = st.color || 'accent', base = st.base ?? 0;
  let r = st.r ?? 3.8;
  if (P.length > 1) { const gap = Math.abs(s.X(P[1][0]) - s.X(P[0][0])); r = Math.min(r, Math.max(1.3, gap * 0.3)); }
  const w = st.width ?? (r < 2.4 ? 1 : 1.6);
  for (const [n, y] of P) if (isFinite(y)) s.line(n, base, n, y, { color: col, width: w, alpha: st.alpha });
  for (const [n, y] of P) if (isFinite(y)) s.dot(n, y, { r, color: col, alpha: st.alpha, ring: r >= 3, hollow: st.hollow });
}

/**
 * A signal the reader redraws by dragging on stage s: N + 1 samples on [a, b], linear in between, zero before a and
 * holding its last value after b. sig.f(t) evaluates it, sig.arr() samples it on the bench grid (cached), sig.set(fn)
 * resets it, sig.ver counts edits. Drawing up to the right edge `edge` of the panel carries the value on beyond it.
 */
export function drawable(s, a, b, N, init, yr, { enabled, edge } = {}) {
  const ys = new Float64Array(N + 1), h = (b - a) / N;
  let cache = null, cver = -1;
  const sig = {
    ys, a, b, N, h, ver: 0,
    set(fn) { for (let i = 0; i <= N; i++) ys[i] = fn(a + i * h); sig.ver++; },
    f(t) { if (!(t >= a)) return 0; if (t >= b) return ys[N]; const u = (t - a) / h, i = Math.min(N - 1, Math.floor(u)); return ys[i] + (ys[i + 1] - ys[i]) * (u - i); },
    arr() { if (cver !== sig.ver) { cache = sample(sig.f); cver = sig.ver; } return cache; },
  };
  sig.set(init);
  const iEdge = edge != null ? Math.floor((edge - a) / h) : N;
  let last = null;
  s.onDrag((x, y, ph) => {
    if (enabled && !enabled()) return;
    if (ph === 'end') { last = null; return; }
    const i = Math.max(0, Math.min(iEdge, Math.round((x - a) / h))), yy = Math.max(yr[0], Math.min(yr[1], y));
    if (!last) ys[i] = yy;
    else {
      const [i0, y0] = last, lo = Math.min(i0, i), hi = Math.max(i0, i);
      for (let k = lo; k <= hi; k++) ys[k] = i === i0 ? yy : y0 + ((yy - y0) * (k - i0)) / (i - i0);
    }
    if (Math.max(i, last ? last[0] : i) >= iEdge - 1) for (let k = iEdge; k <= N; k++) ys[k] = ys[iEdge];
    last = [i, yy]; sig.ver++;
  });
  return sig;
}

/** Block of a block diagram: a rounded box with a TeX label (and an optional small caption under it). */
export function bdBlock(s, x, y, w, h, label, st = {}) {
  const col = st.color || 'ink';
  s.rect(x - w / 2, y - h / 2, x + w / 2, y + h / 2, { fill: 'panel', fillAlpha: 1, stroke: false, radius: 7 });
  s.rect(x - w / 2, y - h / 2, x + w / 2, y + h / 2, { fill: st.fill || col, fillAlpha: st.fillAlpha ?? (st.active ? 0.18 : 0.06), color: col, width: st.active ? 2.4 : 1.6, radius: 7, alpha: st.alpha });
  if (label) s.tex(label, x, y + (st.sub ? h * 0.12 : 0), { size: st.size || 15, color: st.labelColor || 'ink' });
  if (st.sub) s.text(st.sub, x, y - h / 2, { size: 10.5, color: 'muted', align: 'center', baseline: 'bottom', dy: -4 });
}
/** Summing junction of pixel radius rPx with signs placed beside its inputs: signs = {w: '+', s: '−', n: '+', e: '+'}. */
export function bdSum(s, x, y, rPx, signs = {}, st = {}) {
  const X = s.X(x), Y = s.Y(y);
  s.dot(x, y, { r: rPx, hollow: true, color: st.color || 'ink', width: 1.8 });
  s.textPx('Σ', X, Y + 1, { size: 13, color: 'muted', align: 'center', weight: 600, halo: false });
  const off = { w: [-1.3, -1], e: [1.3, -1], n: [1, -1.35], s: [1, 1.35] };
  for (const [d, g] of Object.entries(signs)) { const [dx, dy] = off[d]; s.textPx(g, X + dx * rPx, Y + dy * rPx, { size: 14, weight: 700, color: g === '−' ? 'red' : 'ink', align: 'center' }); }
}
/** Wire along a polyline with an arrowhead at its end. */
export function bdWire(s, P, st = {}) {
  const col = st.color || 'muted', w = st.width ?? 1.7;
  if (P.length > 2) s.path(P.slice(0, -1), { color: col, width: w, alpha: st.alpha });
  const [p, q] = [P[P.length - 2], P[P.length - 1]];
  if (st.arrow === false) s.line(p[0], p[1], q[0], q[1], { color: col, width: w, alpha: st.alpha });
  else s.arrow(p[0], p[1], q[0], q[1], { color: col, width: w, head: st.head ?? 8, alpha: st.alpha });
}
/** Point at arc length u along a polyline. */
export function along(P, u) {
  for (let i = 1; i < P.length; i++) {
    const l = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    if (u <= l || i === P.length - 1) { const f = l ? Math.min(1, Math.max(0, u / l)) : 0; return [P[i - 1][0] + f * (P[i][0] - P[i - 1][0]), P[i - 1][1] + f * (P[i][1] - P[i - 1][1])]; }
    u -= l;
  }
  return P[P.length - 1];
}

/** Numbers for readouts: 3 significant figures, scientific below 10⁻³ (as TeX when tex = true). */
export function num(x, tex = false) {
  if (x == null || Number.isNaN(x)) return '—';
  if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
  const a = Math.abs(x);
  if (a !== 0 && (a < 1e-3 || a >= 1e6)) {
    const e = Math.floor(Math.log10(a)), m = x / 10 ** e;
    return tex ? `${(+m.toFixed(1)).toString().replace('-', '-')}\\times10^{${e}}` : `${(+m.toFixed(1)).toString().replace('-', '−')}·10^${e}`;
  }
  return String(+x.toPrecision(3)).replace('-', '−');
}
/** An error size as TeX, with 0 for exact zeros. */
export const errTex = (e) => (e === 0 ? '0' : !isFinite(e) ? '\\infty' : num(e, true));
