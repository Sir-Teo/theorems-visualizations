// Systems Biology — Chapter 3 shared helpers (feed-forward loop simulator and drawing). Re-exports the chapter-1 helpers.
export * from './ch01.shared.js';
import { hillAct, hillRep } from './ch01.shared.js';

/** Mangan–Alon (2003) Tables 1–2, checked against original diagrams: signs X→Y, Y→Z, X→Z. Coherent when s_XZ = s_XY · s_YZ. */
export const FFL_TYPES = [
  { id: 'C1', s: [1, 1, 1] }, { id: 'C2', s: [-1, 1, -1] }, { id: 'C3', s: [1, -1, -1] }, { id: 'C4', s: [-1, -1, 1] },
  { id: 'I1', s: [1, -1, 1] }, { id: 'I2', s: [-1, -1, -1] }, { id: 'I3', s: [1, 1, -1] }, { id: 'I4', s: [-1, 1, 1] },
];
export const fflType = (sxy, syz, sxz) => {
  const k = FFL_TYPES.find((t) => t.s[0] === sxy && t.s[1] === syz && t.s[2] === sxz);
  return k ? k.id : '?';
};
export const isCoherent = (sxy, syz, sxz) => sxy * syz === sxz;

/** Regulatory term of a sign: activation x^n/(K^n+x^n) or repression K^n/(K^n+x^n). */
export const reg = (sign, x, K, n) => (sign > 0 ? hillAct(x, K, n) : hillRep(x, K, n));
/** Two-input logic on the regulatory terms a, b in [0,1]: AND = ab, OR = a + b − ab, SUM = (a + b)/2. */
export const logic = (kind, a, b) => (kind === 'OR' ? a + b - a * b : kind === 'SUM' ? 0.5 * (a + b) : a * b);

/** Simulate an FFL (X input given as a function of time, Euler with small step; all rates in units of 1/α_Y if α_Y = 1).
 *  p = {sxy, syz, sxz, lg, Kxy, Kyz, Kxz, n, by, ay, bz, az}. Y' = by·reg(sxy, X/Kxy) − ay·Y,
 *  Z' = bz·logic(reg(sxz, X/Kxz), reg(syz, Y/Kyz)) − az·Z. Starts from the steady state at X(0).
 *  Returns {t, X, Y, Z} arrays sampled every step. */
export function fflSim(p, Xof, T, dt = 0.005) {
  const n = p.n ?? 4, N = Math.round(T / dt);
  const yss = (x) => (p.by / p.ay) * reg(p.sxy, x, p.Kxy, n);
  const zss = (x, y) => (p.bz / p.az) * logic(p.lg, reg(p.sxz, x, p.Kxz, n), reg(p.syz, y, p.Kyz, n));
  let x = Xof(0), y = yss(x), z = zss(x, y);
  // the relaxation of Z at fixed Y is fast to settle only if Y is at steady state: iterate once more
  const t = [0], X = [x], Y = [y], Z = [z];
  for (let i = 1; i <= N; i++) {
    const tt = (i - 0.5) * dt; x = Xof(tt);
    const dy = p.by * reg(p.sxy, x, p.Kxy, n) - p.ay * y;
    const dz = p.bz * logic(p.lg, reg(p.sxz, x, p.Kxz, n), reg(p.syz, y, p.Kyz, n)) - p.az * z;
    y += dt * dy; z += dt * dz;
    t.push(i * dt); X.push(Xof(i * dt)); Y.push(y); Z.push(z);
  }
  return { t, X, Y, Z };
}
/** First time after t0 at which series s crosses `level` (either direction), linear interpolation; NaN if never. */
export function crossAfter(t, s, level, t0 = 0, direction = 0) {
  for (let i = 1; i < t.length; i++) {
    if (t[i] < t0) continue;
    const a = s[i - 1] - level, b = s[i] - level;
    if (a * b <= 0 && a !== b && (!direction || direction * (b - a) > 0)) return t[i - 1] + (a / (a - b)) * (t[i] - t[i - 1]);
  }
  return NaN;
}
/** Square pulse(s): 1 on [t0, t1), else 0. */
export const pulseOf = (t0, t1) => (t) => (t >= t0 && t < t1 ? 1 : 0);

/** Draw a regulatory edge between data points: arrow for activation, T-bar for repression; returns nothing. */
export function edge(s, x1, y1, x2, y2, sign, opts = {}) {
  const col = opts.color ?? (sign > 0 ? 'green' : 'red'), w = opts.width ?? 3;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
  if (sign > 0) { s.arrow(x1, y1, x2, y2, { color: col, width: w }); return; }
  s.line(x1, y1, x2, y2, { color: col, width: w });
  // T-bar perpendicular, length in data units (stage assumed ~equal aspect)
  const px = -dy / L, py = dx / L, b = opts.bar ?? 0.09;
  s.line(x2 + px * b, y2 + py * b, x2 - px * b, y2 - py * b, { color: col, width: w + 1 });
}

/** Illustrative single-input or multi-output OR temporal program; forward Euler at fixed dt. */
export function temporalProgram({Kx, Ky = null, ax, ay = 0, az = 1, duration, maximum = 1, T = 24, dt = .01}) {
  const t = [], X = [], Y = [], Z = Kx.map(() => []), z = Kx.map(() => 0);
  let x = 0, y = 0;
  for (let i = 0; i <= Math.round(T / dt); i++) {
    const tt = i * dt; t.push(tt); X.push(x); Y.push(y); z.forEach((q, j) => Z[j].push(q));
    const input = tt >= 1 && tt < 1 + duration ? maximum : 0;
    const nx = x + dt * ax * (input - x), ny = y + dt * ay * ax * (hillAct(x, .6, 4) - y);
    z.forEach((q,j) => {const fx = hillAct(Ky ? x : nx, Kx[j], Ky ? 6 : 4), fy = Ky ? hillAct(y, Ky[j], 6) : 0; z[j] += dt * az * (fx + fy - fx * fy - q);});
    x = nx; y = ny;
  }
  return {t, X, Y, Z};
}
