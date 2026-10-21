// Authored finite-sample illustrations of Shiller's conditional-PV variance argument.
// The caller supplies the unchanged later annual-mean Shiller data, not 1981 Data Set 1.
export function shillerStats(values) {
  if (!values.length) throw new RangeError('A nonempty sample is required.');
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, x) => a + (x - mean) ** 2, 0) / values.length;
  return { mean, variance, sd: Math.sqrt(variance) };
}

export function shillerTransform(rows, count) {
  if (!(count >= 2 && count <= rows.length)) throw new RangeError('Choose an available sample with at least two years.');
  const selected = rows.slice(0, count), cpiBase = rows.at(-1)[3];
  const realPrice = selected.map(q => q[1] * cpiBase / q[3]);
  const center = (count - 1) / 2, logMean = shillerStats(realPrice.map(Math.log)).mean;
  let cross = 0, square = 0;
  realPrice.forEach((x, i) => { cross += (i - center) * (Math.log(x) - logMean); square += (i - center) ** 2; });
  const growth = cross / square;
  // A beginning-period price uses exp(g t); its end-period cash flow uses exp(g(t+1)).
  const p = realPrice.map((x, i) => x / Math.exp(growth * i));
  const d = selected.map((q, i) => q[2] * cpiBase / q[3] / Math.exp(growth * (i + 1)));
  return { count, year: selected.map(q => q[0]), p, d, growth, annualGrowth: Math.expm1(growth), cpiBase };
}

export function shillerFiniteProxy(dividends, rate, terminal) {
  if (!(rate > 0) || !dividends.length || !Number.isFinite(terminal)) throw new RangeError('Positive rate, cash flows and finite terminal value are required.');
  const q = new Array(dividends.length); q[q.length - 1] = terminal;
  for (let i = q.length - 2; i >= 0; i--) q[i] = (dividends[i] + q[i + 1]) / (1 + rate);
  return q;
}

export function shillerHistorical(rows, count, rate, terminalRule) {
  const transformed = shillerTransform(rows, count), price = shillerStats(transformed.p);
  const terminal = terminalRule === 'last' ? transformed.p.at(-1) : price.mean;
  const proxy = shillerFiniteProxy(transformed.d, rate, terminal), target = shillerStats(proxy);
  return { ...transformed, rate, terminalRule, terminal, proxy, price, target, ratio: price.sd / target.sd,
    initialTerminalWeight: (1 + rate) ** (1 - count) };
}

// d_t = mu + x_t is observed before its end-period payment. Future innovations are independent.
export function shillerForecast(dividend, mean, rate, persistence) {
  return mean / rate + (dividend - mean) / (1 + rate - persistence);
}

export function shillerPopulation(rate, persistence, dividendSD = 1) {
  if (!(rate > 0 && Math.abs(persistence) < 1 && dividendSD > 0)) throw new RangeError('Positive rate/scale and stationary persistence are required.');
  const R = 1 + rate, gamma = 1 / R, s2 = dividendSD ** 2;
  const priceVariance = s2 / (R - persistence) ** 2;
  const targetVariance = s2 * gamma ** 2 * (1 + gamma * persistence) / ((1 - gamma ** 2) * (1 - gamma * persistence));
  return { priceVariance, targetVariance, errorVariance: targetVariance - priceVariance,
    ratio: Math.sqrt((R ** 2 - 1) / (R ** 2 - persistence ** 2)) };
}

export function shillerBenchmark({ count, rate, persistence, mean, sd, terminalRule, normal, samples = 400 }) {
  const ratios = [], first = {}; let negativeDividends = 0, negativePrices = 0;
  for (let j = 0; j < samples; j++) {
    let x = sd * normal(); const dividends = [], prices = [];
    for (let t = 0; t < count; t++) {
      const d = mean + x, p = shillerForecast(d, mean, rate, persistence);
      dividends.push(d); prices.push(p); if (d < 0) negativeDividends++; if (p < 0) negativePrices++;
      if (t + 1 < count) x = persistence * x + sd * Math.sqrt(1 - persistence ** 2) * normal();
    }
    const terminal = terminalRule === 'last' ? prices.at(-1) : shillerStats(prices).mean;
    const proxy = shillerFiniteProxy(dividends, rate, terminal);
    const ratio = shillerStats(prices).sd / shillerStats(proxy).sd;
    if (!Number.isFinite(ratio)) throw new Error('A finite nonconstant proxy is required.');
    ratios.push(ratio); if (j === 0) Object.assign(first, { dividends, prices, proxy, terminal });
  }
  const aboveOne = ratios.filter(x => x > 1).length;
  return { ratios, first, samples, aboveOne, meanRatio: shillerStats(ratios).mean, min: Math.min(...ratios), max: Math.max(...ratios),
    negativeDividends, negativePrices, population: shillerPopulation(rate, persistence, sd) };
}

export function shillerHistogram(ratios, observedRatio, bins = 40) {
  if (!ratios.length || !ratios.every(x => x >= 0 && Number.isFinite(x)) || !(observedRatio >= 0 && Number.isFinite(observedRatio))) throw new RangeError('Finite nonnegative ratios are required.');
  const upper = Math.max(1, observedRatio, ...ratios) * 1.08 + .1, width = upper / bins, counts = new Array(bins).fill(0);
  // The upper edge strictly exceeds every value: there is no overflow or tail folding.
  for (const x of ratios) { let k = 0; while (x >= (k + 1) * width) k++; counts[k]++; }
  return { upper, width, counts, aboveObserved: ratios.filter(x => x >= observedRatio).length };
}
