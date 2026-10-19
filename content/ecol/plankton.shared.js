// Huisman & Weissing, Nature 402 (1999), pp. 407–410, Methods and Fig. 4.
// Source matrices have resources in rows; these arrays are transposed to species rows.
import { hwStep } from './ch04.shared.js';
export const PLANKTON_K = [[0.39, 0.22, 0.27, 0.30, 0.34], [0.34, 0.39, 0.22, 0.24, 0.30], [0.30, 0.34, 0.39, 0.22, 0.22], [0.24, 0.30, 0.34, 0.39, 0.20], [0.23, 0.27, 0.30, 0.34, 0.39],
          [0.41, 0.16, 0.07, 0.28, 0.40], [0.20, 0.15, 0.11, 0.12, 0.50], [0.45, 0.05, 0.05, 0.13, 0.26], [0.14, 0.38, 0.38, 0.27, 0.12], [0.15, 0.29, 0.41, 0.33, 0.29], [0.38, 0.37, 0.24, 0.04, 0.09], [0.28, 0.31, 0.25, 0.41, 0.16]];
export const PLANKTON_Q = [[0.04, 0.08, 0.10, 0.05, 0.07], [0.04, 0.08, 0.10, 0.03, 0.09], [0.07, 0.08, 0.10, 0.03, 0.07], [0.04, 0.10, 0.10, 0.03, 0.07], [0.04, 0.08, 0.14, 0.03, 0.07],
          [0.22, 0.14, 0.22, 0.09, 0.05], [0.10, 0.22, 0.24, 0.07, 0.24], [0.08, 0.04, 0.12, 0.06, 0.05], [0.02, 0.18, 0.03, 0.03, 0.08], [0.17, 0.06, 0.24, 0.03, 0.10], [0.25, 0.20, 0.17, 0.11, 0.02], [0.03, 0.04, 0.01, 0.05, 0.04]];
export const PLANKTON_SUPPLY = [6, 10, 14, 4, 9];

export const planktonParameters = n => ({ K: PLANKTON_K.slice(0, n), Q: PLANKTON_Q.slice(0, n), S: PLANKTON_SUPPLY, D: .25, m: .25, r: 1 });
export function introducePlankton(st, ids, time, perturbation = 0) {
  for (const i of ids) st.N[i] = (time === 0 ? .1 + (i + 1) / 100 : .1) + (i === 0 ? perturbation : 0);
}
export function runPlankton(n, T = n === 5 ? 1000 : 10000, perturbation = 0, dt = .05) {
  const P = planktonParameters(n), st = { N: Array(n).fill(0), R: P.S.slice(), t: 0 };
  const introductions = [[0, [0, 1, 2, 3, 4]], [1000, [5, 6, 7]], [3000, [8, 9]], [5000, [10, 11]]];
  const events = new Map(introductions.map(([t, ids]) => [Math.round(t / dt), ids.filter(i => i < n)]));
  const recordEvery = Math.round(5 / dt), steps = Math.round(T / dt), records = [];
  for (let step = 0; step <= steps; step++) {
    if (events.has(step)) introducePlankton(st, events.get(step), step * dt, perturbation);
    if (step % recordEvery === 0) records.push(Float64Array.from(st.N));
    if (step < steps) hwStep(P, st, dt);
  }
  return records;
}
