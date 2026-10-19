// Specified two-consumer exchange models for micro-9.6/9.7. Good 2 is the numeraire.
// Model algebra is separate from the general existence theorem; no scanned roots establish nonexistence.
export function cdBudgetDemand(a, prices, endowment) {
  const [p1, p2] = prices, income = p1 * endowment[0] + p2 * endowment[1];
  return [a * income / p1, (1 - a) * income / p2];
}

export function blissBudgetDemand(p, income) {
  if (4 * p + 4 <= income) return [4, 4];
  const t = (4 * p + 4 - income) / (p * p + 1);
  let x = 4 - p * t, y = 4 - t;
  if (x < 0) { x = 0; y = income; }
  else if (y < 0) { y = 0; x = income / p; }
  return [x, y];
}

const tidy = (x) => Math.abs(x) < 1e-12 ? 0 : x;
export function walrasBudgetState(p, satiated = false) {
  const endowmentA = [7, 2], endowmentB = [3, 8];
  const incomeA = 7 * p + 2, incomeB = 3 * p + 8;
  const demandA = satiated ? blissBudgetDemand(p, incomeA) : cdBudgetDemand(.35, [p, 1], endowmentA);
  const demandB = cdBudgetDemand(.6, [p, 1], endowmentB);
  const spendingA = p * demandA[0] + demandA[1], spendingB = p * demandB[0] + demandB[1];
  const unspentA = tidy(incomeA - spendingA), unspentB = tidy(incomeB - spendingB);
  const z = [tidy(demandA[0] + demandB[0] - 10), tidy(demandA[1] + demandB[1] - 10)];
  const valueTerms = [p * z[0], z[1]], value = tidy(valueTerms[0] + valueTerms[1]);
  return { p, satiated, endowmentA, endowmentB, incomeA, incomeB, demandA, demandB,
    spendingA, spendingB, unspentA, unspentB, z, valueTerms, value,
    market1Price: satiated ? 8 / 7 : 22 / 23, blissThreshold: 2 / 3 };
}

export function exchangeExcessBranch(p, wx, wy, branch = 'cd') {
  if (branch === 'left') return -wx / 2 + (10 - wy / 2) / p;
  if (branch === 'right') return wx / 2 + wy / (2 * p) - 10;
  return wx / 2 - 10 + (4 + wy / 10) / p + .4 * (10 - wx);
}

export function existenceExchangeState(p, wx, wy, nonconvex = false) {
  const endowmentA = [wx, wy], endowmentB = [10 - wx, 10 - wy];
  const incomeA = p * wx + wy, incomeB = p * (10 - wx) + 10 - wy;
  const demandA = cdBudgetDemand(.5, [p, 1], endowmentA);
  const demandB = nonconvex ? (p <= 1 ? [incomeB / p, 0] : [0, incomeB]) : cdBudgetDemand(.4, [p, 1], endowmentB);
  const alternateB = nonconvex && p === 1 ? [0, incomeB] : null;
  const z = [tidy(demandA[0] + demandB[0] - 10), tidy(demandA[1] + demandB[1] - 10)];
  const equilibriumPrice = nonconvex ? null : (4 + wy / 10) / (6 - wx / 10);
  const jumpHalf = 10 - (wx + wy) / 2;
  return { p, wx, wy, nonconvex, endowmentA, endowmentB, incomeA, incomeB, demandA, demandB,
    alternateB, boxA: demandA, boxB: demandB.map(c => 10 - c),
    alternateBoxB: alternateB?.map(c => 10 - c) ?? null, z, value: tidy(p * z[0] + z[1]),
    equilibriumPrice, jumpHalf };
}

export function paddedRange(values, fraction = .12, minimumSpan = 1) {
  const lo = Math.min(...values), hi = Math.max(...values), d = Math.max(minimumSpan, hi - lo);
  return [lo - fraction * d, hi + fraction * d];
}
