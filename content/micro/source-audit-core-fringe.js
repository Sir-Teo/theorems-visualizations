// Explicit teaching models for the two-person exchange core and a dominant firm.
export const coreUtility = (a, x, y) => x <= 0 || y <= 0 ? 0 : x ** a * y ** (1 - a);
export function coreCurveY(a, b, x) {
  return 10 * b * (1 - a) * x / (10 * a * (1 - b) + (b - a) * x);
}
function increasingRoot(f, target) {
  if (target <= f(0)) return 0;
  if (target >= f(10)) return 10;
  let lo = 0, hi = 10;
  for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (f(mid) < target) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
export function coreInterval(a, b, wx, wy) {
  const reservationA = coreUtility(a, wx, wy), reservationB = coreUtility(b, 10 - wx, 10 - wy);
  const uA = x => coreUtility(a, x, coreCurveY(a, b, x));
  const minusUB = x => -coreUtility(b, 10 - x, 10 - coreCurveY(a, b, x));
  let lower = increasingRoot(uA, reservationA), upper = increasingRoot(minusUB, -reservationB);
  if (Math.abs(lower - upper) < 2e-12) lower = upper = (lower + upper) / 2;
  return { lower, upper, reservationA, reservationB,
    lowPoint: [lower, coreCurveY(a, b, lower)], highPoint: [upper, coreCurveY(a, b, upper)] };
}
export function coreAllocationState(a, b, wx, wy, x, y) {
  const interval = coreInterval(a, b, wx, wy), uA = coreUtility(a, x, y), uB = coreUtility(b, 10 - x, 10 - y);
  const slackA = uA - interval.reservationA, slackB = uB - interval.reservationB;
  const curveY = coreCurveY(a, b, x), residual = y - curveY, efficient = Math.abs(residual) <= 1e-10;
  const blockA = slackA < -1e-10, blockB = slackB < -1e-10;
  let witness = null;
  if (!efficient) {
    const ownInterval = coreInterval(a, b, x, y), q = (ownInterval.lower + ownInterval.upper) / 2, w = [q, coreCurveY(a, b, q)];
    const gains = [coreUtility(a, ...w) - uA, coreUtility(b, 10 - w[0], 10 - w[1]) - uB];
    // Near a tangency, gains are second-order and may fall below floating-point resolution.
    // Keep the efficiency decision separate; do not present an unresolved candidate as a measured block.
    witness = { point: w, gains, resolved: gains.every(g => g >= -1e-12) && gains.some(g => g > 1e-12) };
  }
  const verdict = blockA && blockB ? 'blocked by either singleton' : blockA ? 'blocked by A alone' : blockB ? 'blocked by B alone' : !efficient ? 'blocked by the pair' : 'in the computed core';
  return { a, b, wx, wy, x, y, ...interval, uA, uB, slackA, slackB, curveY, residual, efficient, blockA, blockB,
    inCore: !blockA && !blockB && efficient, verdict, witness };
}

export function dominantFirmState(fringe, cost, slope) {
  const d = 1 + fringe, rawNumerator = 20 - d * cost;
  const numerator = Math.abs(rawNumerator) < 1e-12 ? 0 : rawNumerator;
  const quantity = Math.max(0, numerator / (2 + d * slope));
  const price = (20 - quantity) / d, fringeQuantity = fringe * price, total = 20 - price;
  const inverse = q => (20 - q) / d, marginalRevenue = q => (20 - 2 * q) / d, marginalCost = q => cost + slope * q;
  const profitAt = q => q * inverse(q) - cost * q - .5 * slope * q * q;
  const monopolyQuantity = (20 - cost) / (2 + slope), monopolyPrice = 20 - monopolyQuantity;
  const competitivePrice = Math.min((20 * slope + cost) / (1 + d * slope), 20 / d);
  return { fringe, cost, slope, quantity, price, fringeQuantity, total, share: quantity / total,
    profit: profitAt(quantity), derivative: marginalRevenue(quantity) - marginalCost(quantity),
    mr: marginalRevenue(quantity), mc: marginalCost(quantity), active: quantity > 0,
    monopolyQuantity, monopolyPrice, competitivePrice, inverse, marginalRevenue, marginalCost, profitAt };
}
