// Quantitative models used in the source-reviewed Big History displays.
export const logisticValue = (initial, rate, elapsed) => 1 / (1 + (1 / initial - 1) * Math.exp(-rate * elapsed));
export function logisticRecovery(initial, killed, rate, targetFraction = .9) {
  if (1 - killed >= targetFraction) return 0;
  const logit = p => Math.log(p / (1 - p));
  return (logit(targetFraction * initial) - logit((1 - killed) * initial)) / rate;
}
export const iridiumSchematic = (height, enhancement) =>
  1 + (enhancement - 1) * Math.exp(-.5 * (height / (height < 0 ? .5 : 1.2)) ** 2);
export function founderSample(random, frequency, founders) {
  let copies = 0;
  for (let k = 0; k < 2 * founders; k++) if (random() < frequency) copies++;
  return copies / (2 * founders);
}
export const coalescenceCDF = (ka, original, reduced, startKa, durationYears, generationYears) => {
  const inside = Math.max(0, Math.min(ka, startKa) - Math.max(0, startKa - durationYears / 1000));
  const hazard = 1000 / generationYears * ((ka - inside) / (2 * original) + inside / (2 * reduced));
  return -Math.expm1(-hazard);
};

// Complete segments in a finite observation window are length-biased toward
// short tracts: their possible start positions have measure (window-length).
// Conditioning also on length >= threshold gives density proportional to
// (window-length) exp[-rate*(length-threshold)], not a shifted exponential.
function windowMoments(z) {
  if (z < .05) {
    let term = 1, zeroth = 0, first = 0;
    for (let k = 0; k < 20; k++) {
      zeroth += term / ((k + 1) * (k + 2));
      first += term / ((k + 2) * (k + 3));
      term *= -z / (k + 1);
    }
    return [zeroth, first];
  }
  const e = Math.exp(-z);
  return [(z - 1 + e) / z ** 2, (z - 2 + (z + 2) * e) / z ** 3];
}
export function completeSegmentMean(rate, window, threshold = 0) {
  const remaining = window - threshold;
  if (!(remaining > 0) || rate < 0) return NaN;
  const [m0, m1] = windowMoments(rate * remaining);
  return threshold + remaining * m1 / m0;
}
export function completeSegmentDensity(length, rate, window, threshold = 0) {
  const remaining = window - threshold;
  if (!(remaining > 0) || rate < 0) return NaN;
  if (length < threshold || length > window) return 0;
  return (window - length) * Math.exp(-rate * (length - threshold)) / (remaining ** 2 * windowMoments(rate * remaining)[0]);
}
export function estimateSegmentRate(lengths, window, threshold = 0) {
  if (!lengths.length || !(window > threshold)) return NaN;
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  if (mean >= completeSegmentMean(0, window, threshold)) return 0; // boundary likelihood maximum
  if (mean <= threshold) return Infinity;
  let lo = 0, hi = 1 / (mean - threshold);
  while (completeSegmentMean(hi, window, threshold) > mean) hi *= 2;
  for (let k = 0; k < 80; k++) {
    const mid = (lo + hi) / 2;
    if (completeSegmentMean(mid, window, threshold) > mean) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

export function uniformTiming(arrival, extinction, climate = null) {
  const [a, b] = arrival, [c, d] = extinction, wa = b - a, we = d - c;
  const pos = x => Math.max(0, x);
  let probability, positiveLag;
  if (!wa && !we) { probability = a > c ? 1 : 0; positiveLag = pos(a - c); }
  else if (!wa) {
    probability = Math.max(0, Math.min(1, (a - c) / we));
    positiveLag = a <= c ? 0 : a >= d ? a - (c + d) / 2 : (a - c) ** 2 / (2 * we);
  } else if (!we) {
    probability = Math.max(0, Math.min(1, (b - c) / wa));
    const lower = Math.max(a, c);
    positiveLag = b > lower ? (b - lower) * ((b + lower) / 2 - c) / wa : 0;
  } else {
    const lower = Math.max(a, c), upper = Math.min(b, d), overlap = Math.max(0, upper - lower);
    const tailStart = Math.max(a, d), tail = Math.max(0, b - tailStart);
    probability = (overlap * ((upper - c) + (lower - c)) / (2 * we) + tail) / wa;
    const x = upper - c, y = lower - c;
    positiveLag = (overlap * (x * x + x * y + y * y) / (6 * we)
      + tail * ((b + tailStart) / 2 - (c + d) / 2)) / wa;
  }
  const pClim = !climate ? null : !we ? Number(c >= climate[0] && c <= climate[1])
    : Math.max(0, Math.min(d, climate[1]) - Math.max(c, climate[0])) / we;
  return { pAfter: probability, lag: probability ? Math.max(0, positiveLag) / probability : NaN, pClim };
}
