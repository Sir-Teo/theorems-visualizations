import { idxAt } from './ch02.shared.js';
export const TW = {
  fast: { c1: 0.3, cmax: 1, K: 0.5, tc: 25, tr: 20, td: 45, nrm: 0.49 },
  slow: { c1: 0.3, cmax: 1, K: 0.5, tc: 80, tr: 60, td: 140, nrm: 0.69 },
};
export function twitchRun(f, P, o = {}) {
  const dt = 0.5, tEnd = o.tEnd ?? 800, trainEnd = o.trainEnd ?? 600, T = 1000 / f, single = o.single, Fmax = P.nrm;
  let c = 0, F = 0, next = 20; const ts = [], Fs = [], cs = [], stim = [];
  for (let t = 0; t <= tEnd + 1e-9; t += dt) {
    if (t >= next - 1e-9 && next <= trainEnd + 20 && !(single && stim.length >= 1)) { c += P.c1 * (1 - c / P.cmax); stim.push(next); next += T; }
    const A = (c * c) / (c * c + P.K * P.K), tau = A > F ? P.tr : P.td;
    ts.push(t); Fs.push(F / Fmax); cs.push(c);
    F += (dt * (A - F)) / tau; c -= (dt * c) / P.tc;
  }
  return { t: ts, F: Fs, c: cs, stim };
}
/** Peak and trough of the force over the last two stimulus intervals (and the decay that follows the last stimulus). */
export function windowStats(r, f) {
  const n = r.stim.length, T = 1000 / f, t0 = n >= 3 ? r.stim[n - 3] : r.stim[0], t1 = n >= 3 ? r.stim[n - 1] : r.stim[n - 1] + T;
  const seg = r.F.slice(idxAt(r.t, t0), idxAt(r.t, Math.min(r.t[r.t.length - 1], r.stim[n - 1] + T)) + 1), core = r.F.slice(idxAt(r.t, t0), idxAt(r.t, t1) + 1);
  return { max: Math.max(...seg), min: n >= 3 ? Math.min(...core) : 0, mean: core.reduce((a, b) => a + b, 0) / core.length };
}
const tetTable = {};
export function tetanusCurve(type) {
  if (tetTable[type]) return tetTable[type];
  const P = TW[type], out = [];
  for (let k = 0; k <= 36; k++) { const f = Math.pow(10, (2 * k) / 36); out.push({ f, ...windowStats(twitchRun(f, P), f) }); }
  tetTable[type] = out; return out;
}

