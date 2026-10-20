// Authored illustrations for Fama (1970), not fitted economic models.
// Signal-change charge only: continuing daily leverage resets incur no extra charge here.
export function signRule(returns, start, end, costBp = 0) {
  if (!(start >= 1 && end > start && end <= returns.length)) throw new RangeError('A lagged return and a nonempty sample are required');
  let previous = 0, turnover = 0;
  const gross = [], net = [], hold = [], positions = [];
  for (let i = start; i < end; i++) {
    const position = Math.sign(returns[i - 1]) || 1;
    const units = Math.abs(position - previous) + (i === end - 1 ? Math.abs(position) : 0);
    const g = position * returns[i];
    positions.push(position); gross.push(g); net.push(g - costBp * 1e-4 * units); hold.push(returns[i]);
    previous = position; turnover += units;
  }
  return { start, end, gross, net, hold, positions, turnover };
}

export function wealthPath(returns, start, years) {
  let logWealth = 0;
  const points = [[years[start - 1], 0]];
  for (let j = 0; j < returns.length; j++) {
    if (!(returns[j] > -1)) throw new RangeError('Log wealth requires positive wealth');
    logWealth += Math.log1p(returns[j]) / Math.LN10;
    points.push([years[start + j], logWealth]);
  }
  return points;
}

export function newsLevel(time, leak, tau) {
  return time < 0 ? leak * (time + 30) / 30 : leak + (1 - leak) * -Math.expm1(-time / tau);
}

// x and e are independent equiprobable signs. Units are percentage points.
export function benchmarkExperiment(beta, gamma, mu = 0.5, sigma = 1.5) {
  const states = [-1, 1].flatMap(x => [-1, 1].map(e => ({
    x, e, probability: 0.25, r: mu + beta * x + sigma * e,
    benchmark: mu + gamma * x, trueMean: mu + beta * x,
  })));
  return { beta, gamma, mu, sigma, states, conditional: [-1, 1].map(x => ({
    x, mean: mu + beta * x, benchmark: mu + gamma * x, alpha: (beta - gamma) * x,
  })), rawRule: beta, benchmarkRule: gamma, abnormalRule: beta - gamma };
}

// Weighted post-event mean is flat by construction at EVERY weight, including 0 and 1.
export function splitIllustration(weight) {
  const increase = [], decrease = [], aggregate = [];
  for (let t = -30; t <= 30; t++) {
    const base = 0.9 * Math.min(t + 30, 30), move = 0.35 * Math.min(Math.max(t, 0), 6);
    increase.push([t, base + (1 - weight) * move]);
    decrease.push([t, base - weight * move]);
    aggregate.push([t, base]);
  }
  return { increase, decrease, aggregate, pre: 27, post: 0 };
}

// Known standard deviation, so these are Gaussian z scores, not estimated t statistics.
export function fundIllustration(random, normal, skilledShare, count = 400) {
  const standardError = 4 / Math.sqrt(10), values = [];
  let hits = 0, skilled = 0;
  for (let i = 0; i < count; i++) {
    const isSkilled = random() < skilledShare;
    const z = (isSkilled ? 3 : -0.8) / standardError + normal();
    values.push(z); skilled += +isSkilled; hits += +(z > 1.96);
  }
  const rawLo = Math.min(-4, ...values), rawHi = Math.max(4, ...values), pad = 0.06 * (rawHi - rawLo);
  const lo = rawLo - pad, hi = rawHi + pad, width = (hi - lo) / 28, bins = new Array(28).fill(0);
  for (const z of values) bins[Math.min(27, Math.max(0, Math.floor((z - lo) / width)))]++;
  return { values, hits, skilled, count, standardError, lo, hi, width, bins };
}
