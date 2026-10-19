// An authored finite scheduling model, not data from the retracted experiment.
export const DEADLINE_WEEKS = 12;
export const BUSY_WEEKS = [4, 8];

export function deadlineCost(dates, busy, crunch) {
  const counts = Array(DEADLINE_WEEKS + 1).fill(0);
  for (const date of dates) counts[date]++;
  return counts.reduce((total, n, date) => total + n * (1 + (BUSY_WEEKS.includes(date) ? busy : 0)) + crunch * n * (n - 1) / 2, 0);
}

export function deadlineComparison(d1, d2, busy, crunch) {
  const dates = [Math.min(d1, d2), Math.max(d1, d2), DEADLINE_WEEKS];
  let best = Infinity, bestDates;
  for (let a = 1; a <= DEADLINE_WEEKS; a++) for (let b = a; b <= DEADLINE_WEEKS; b++) {
    const candidate = [a, b, DEADLINE_WEEKS], cost = deadlineCost(candidate, busy, crunch);
    if (cost < best) { best = cost; bestDates = candidate; }
  }
  // Every task costs at least one. Weeks 1,2,3 attain that lower bound
  // with no busy surcharge or same-week pair, for all offered parameters.
  return { dates, bestDates, values: [deadlineCost([12, 12, 12], busy, crunch), deadlineCost([4, 8, 12], busy, crunch), deadlineCost(dates, busy, crunch), best, 3] };
}
