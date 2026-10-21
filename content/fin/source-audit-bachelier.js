// Modern zero-rate arithmetic-Gaussian illustration, not historical price data.
import { erfc, integrate } from '../../assets/js/viz/math.js';

export const normalPdf = z => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
export const normalUpperTail = z => 0.5 * erfc(z / Math.SQRT2);

export function normalCall(spot, strike, sd) {
  if (![spot, strike, sd].every(Number.isFinite) || sd < 0) throw new RangeError('Finite prices and nonnegative standard deviation required');
  const m = spot - strike;
  if (sd === 0) return Math.max(m, 0);
  // Put-call symmetry avoids subtracting a CDF rounded to one. The floor only
  // removes floating-point cancellation/underflow, not a negative option value.
  const a = Math.abs(m) / sd, extrinsic = sd * Math.max(0, normalPdf(a) - a * normalUpperTail(a));
  return Math.max(m, 0) + extrinsic;
}

export function normalCallIntegral(spot, strike, sd) {
  if (sd === 0) return Math.max(spot - strike, 0);
  const a = (strike - spot) / sd;
  if (a >= 0) {
    // z = a + u/(1+a) resolves the very narrow far-tail payoff peak.
    const c = 1 + a;
    return sd * normalPdf(a) / (c * c) * integrate(u => u * Math.exp(-a * u / c - u * u / (2 * c * c)), 0, 40, 1600);
  }
  return sd * integrate(z => (z - a) * normalPdf(z), Math.max(a, -12), 12, 1600);
}

export function bachelierLaw(sigma = 1, time = 40, strike = 102) {
  if (!(sigma >= 0.2 && sigma <= 2 && Number.isInteger(time) && time >= 1 && time <= 60 && strike >= 85 && strike <= 115)) throw new RangeError('Controls outside illustrated family');
  const spot = 100, sd = sigma * Math.sqrt(time), m = spot - strike, h = Math.hypot(m, 2 * sd);
  const u = m < 0 ? 2 * sd * sd / (h - m) : (m + h) / 2, peakX = strike + u;
  return {
    spot, sd, sigma, time, strike, call: normalCall(spot, strike, sd), integral: normalCallIntegral(spot, strike, sd),
    terminalAbove: normalUpperTail(-m / sd), continuousHit: strike <= spot ? 1 : 2 * normalUpperTail(-m / sd),
    peakX, peakY: u * normalPdf((peakX - spot) / sd) / sd,
    pdf: x => normalPdf((x - spot) / sd) / sd,
    integrand: x => Math.max(x - strike, 0) * normalPdf((x - spot) / sd) / sd,
  };
}

export function standardGaussianWalks(normal, count = 4000, days = 60) {
  return Array.from({ length: count }, () => {
    const p = new Float64Array(days + 1);
    for (let t = 1; t <= days; t++) p[t] = p[t - 1] + normal();
    return p;
  });
}

export function sampledBachelier(paths, sigma, time, strike) {
  const prices = []; let payoffMean = 0, payoffM2 = 0, hit = 0, above = 0;
  for (let i = 0; i < paths.length; i++) {
    const price = 100 + sigma * paths[i][time], payoff = Math.max(price - strike, 0), d = payoff - payoffMean;
    prices.push(price); payoffMean += d / (i + 1); payoffM2 += d * (payoff - payoffMean);
    let touched = strike <= 100;
    for (let t = 1; t <= time && !touched; t++) touched = 100 + sigma * paths[i][t] >= strike;
    hit += +touched; above += +(price >= strike);
  }
  return { prices, count: paths.length, call: payoffMean, callSE: Math.sqrt(payoffM2 / ((paths.length - 1) * paths.length)), dailyHit: hit / paths.length, terminalAbove: above / paths.length };
}

export function terminalHistogram(prices, sd, bins = 36) {
  let lo = 100 - 5 * sd, hi = 100 + 5 * sd;
  for (const x of prices) { lo = Math.min(lo, x); hi = Math.max(hi, x); }
  const margin = 0.05 * (hi - lo); lo -= margin; hi += margin;
  const width = (hi - lo) / bins, counts = new Array(bins).fill(0);
  for (const x of prices) counts[Math.min(bins - 1, Math.max(0, Math.floor((x - lo) / width)))]++;
  return { lo, hi, width, bins: counts.map((count, i) => ({ lo: lo + i * width, hi: lo + (i + 1) * width, count, density: count / (prices.length * width) })) };
}
