/** Authored affine-demand, zero-cost specialization of Cournot1838, VII§§43–46.
 * Strategy space is q_i>=0, with quadratic profit q_i(1-q_i-Q_-i).
 * Displayed starts have nonnegative affine prices; they are not capacities.
 * Flooring price at zero would define a different game.
 */
export const COURNOT_EQUILIBRIUM = 1 / 3;
const finite = x => Number.isFinite(x);
const unit = x => finite(x) && x >= 0 && x <= 1;

export function cournotProfit(own, rivals) {
  if (!finite(own) || own < 0 || !finite(rivals) || rivals < 0) throw new RangeError('Nonnegative finite outputs required');
  return own * (1 - own - rivals);
}

export function cournotReply(rivals) {
  if (!finite(rivals) || rivals < 0) throw new RangeError('Nonnegative finite rival output required');
  // Center the affine expression to preserve the exact represented fixed point.
  return Math.max(0, COURNOT_EQUILIBRIUM - (rivals - COURNOT_EQUILIBRIUM) / 2);
}

/** Euclidean projection onto the closed nonnegative-price start triangle. */
export function cournotProject(x, y) {
  if (!finite(x) || !finite(y)) throw new RangeError('Finite coordinates required');
  const a = Math.max(0, x), b = Math.max(0, y);
  if (a + b <= 1) return [a, b];
  const q = Math.max(0, Math.min(1, (1 + x - y) / 2));
  return [q, 1 - q];
}

/** Initial point plus every alternating reply, firm1 first. No skipped steps. */
export function cournotTrace(start, steps = 18) {
  if (!Array.isArray(start) || start.length !== 2 || !start.every(unit) || start[0] + start[1] > 1 + 2e-15 || !Number.isInteger(steps) || steps < 0 || steps > 10000) throw new RangeError('A feasible start and finite integer reply count are required');
  let [x, y] = start;
  const path = [[x, y]];
  for (let i = 0; i < steps; i++) {
    if (i % 2 === 0) x = cournotReply(y); else y = cournotReply(x);
    path.push([x, y]);
  }
  return path;
}

export function cournotMany(n) {
  if (!Number.isSafeInteger(n) || n < 1) throw new RangeError('A positive safe integer producer count is required');
  const q = 1 / (n + 1), total = n / (n + 1);
  return { n, q, total, price: q, firmProfit: q * q };
}

export function cournotState(start, selected, n) {
  if (!Number.isInteger(selected) || selected < 0 || selected > 18) throw new RangeError('Select reply0–18');
  const path = cournotTrace(start), point = path[selected], many = cournotMany(n);
  return { start: [...start], selected, path, point, price: 1 - point[0] - point[1], profits: [cournotProfit(point[0], point[1]), cournotProfit(point[1], point[0])], many };
}
