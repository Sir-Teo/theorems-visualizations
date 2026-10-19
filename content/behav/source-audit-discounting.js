// Thaler (1981), actual Table 2: do not mix questionnaire forms A and C.
export const THALER_FORM_C = Object.freeze([
  Object.freeze({ t: 1 / 12, now: 15, later: 20, rate: 12 * Math.log(20 / 15) }),
  Object.freeze({ t: 1, now: 15, later: 50, rate: Math.log(50 / 15) }),
  Object.freeze({ t: 10, now: 15, later: 100, rate: Math.log(100 / 15) / 10 }),
]);
export const THALER_FORM_A_YEAR = Object.freeze([
  Object.freeze({ now: 15, later: 60, rate: Math.log(60 / 15) }),
  Object.freeze({ now: 250, later: 350, rate: Math.log(350 / 250) }),
  Object.freeze({ now: 3000, later: 4000, rate: Math.log(4000 / 3000) }),
]);

export const hyperbolicDiscount = (k, t) => 1 / (1 + k * t);
export const hyperbolicAverageRate = (k, t) => t === 0 ? k : Math.log1p(k * t) / t;
export const hyperbolicInstantaneousRate = (k, t) => k / (1 + k * t);
export function hyperbolicFitError(k) {
  return THALER_FORM_C.reduce((sum, p) => sum + (Math.log(hyperbolicAverageRate(k, p.t)) - Math.log(p.rate)) ** 2, 0);
}
export function fitThalerHyperbola() {
  let best = { k: 0.2, error: Infinity, index: -1 };
  for (let i = 0; i <= 600; i++) {
    const k = 0.2 * 100 ** (i / 600), error = hyperbolicFitError(k);
    if (error < best.error) best = { k, error, index: i };
  }
  return best;
}

// Authored amount-dependent, positive money-rate schedule, not an estimate or
// a derivation of Loewenstein–Prelec's reference-dependent utility model.
export function magnitudeRate(amount, { large = 0.27, small = 1.39, curvature = 1, loss = false, lossFraction = 0.5 } = {}) {
  const rate = (large + (small - large) * (15 / amount) ** curvature) * (loss ? lossFraction : 1);
  if (!(amount > 0 && Number.isFinite(rate) && rate > 0)) throw new RangeError('Positive amount and money rate required');
  return rate;
}
export function magnitudeModel({ large = 0.27, small = 1.39, curvature = 1, single = 0.3, loss = false, lossFraction = 0.5 } = {}) {
  const params = { large, small, curvature, loss, lossFraction };
  const rate = (amount) => magnitudeRate(amount, params), singleRate = single * (loss ? lossFraction : 1);
  const endpoints = [rate(10), rate(5000)];
  const values = endpoints.concat(singleRate, loss ? [] : THALER_FORM_A_YEAR.map(p => p.rate));
  const low = Math.min(...values), high = Math.max(...values);
  return { rate, singleRate, low, high, direction: small > large ? 'decreases' : small < large ? 'increases' : 'is constant', logRatio: (amount, delay) => rate(amount) * delay };
}
