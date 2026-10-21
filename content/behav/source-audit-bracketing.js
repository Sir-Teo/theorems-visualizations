// Ordinary-probability evaluation of an authored sequence of independent
// +$200/−$100 fair-coin bets; no probability weighting or empirical fit.
const distributions = new Map();
export function bracketDistribution(n) {
  if (!(Number.isInteger(n) && n >= 1 && n <= 100)) throw new RangeError('Integer number of bets in [1,100] required');
  if (!distributions.has(n)) {
    const out = []; let probability = 2 ** -n;
    for (let wins = 0; wins <= n; wins++) {
      out.push(Object.freeze({ wins, total: 300 * wins - 100 * n, probability }));
      probability *= (n - wins) / (wins + 1);
    }
    distributions.set(n, Object.freeze(out));
  }
  return distributions.get(n);
}

export function bracketScenario(alpha = 1, lambda = 2.5) {
  if (!(alpha >= 0.5 && alpha <= 1 && lambda >= 1 && lambda <= 4)) throw new RangeError('0.5 <= alpha <= 1 and 1 <= lambda <= 4 required');
  const rows = [];
  for (let n = 1; n <= 100; n++) {
    let gain = 0, loss = 0, lossProbability = 0, zeroProbability = 0;
    for (const p of bracketDistribution(n)) {
      if (p.total > 0) gain += p.probability * p.total ** alpha;
      else if (p.total < 0) { loss += p.probability * (-p.total) ** alpha; lossProbability += p.probability; }
      else zeroProbability += p.probability;
    }
    const value = gain - lambda * loss;
    const decision = Math.abs(value) <= 1e-12 * Math.max(1, gain, lambda * loss) ? 0 : Math.sign(value);
    rows.push({ n, gain, loss, value, decision, lossProbability, zeroProbability, mean: 50 * n, sd: 150 * Math.sqrt(n) });
  }
  const singleValue = rows[0].value;
  const accepted = rows.filter(r => r.decision > 0).map(r => r.n), ranges = [];
  for (const n of accepted) {
    const last = ranges.at(-1);
    if (last && last[1] === n - 1) last[1] = n;
    else ranges.push([n, n]);
  }
  return { rows, singleValue, singleDecision: rows[0].decision, firstAccepted: accepted[0] ?? null, accepted, ranges };
}

// Authored piecewise-linear specialization of acquisition + transaction value.
export function transactionParts(price, reference, { value = 1.5, lambda = 2.25, weight = 1 } = {}) {
  const acquisition = value - price, gap = reference - price;
  const transaction = weight * (gap >= 0 ? gap : lambda * gap);
  return { acquisition, transaction, total: acquisition + transaction };
}
export function transactionWtp(reference, { value = 1.5, lambda = 2.25, weight = 1 } = {}) {
  const slope = weight * (value <= reference ? 1 : lambda);
  return (value + slope * reference) / (1 + slope);
}
