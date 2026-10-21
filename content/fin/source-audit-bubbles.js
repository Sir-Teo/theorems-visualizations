// Constant-dividend illustration of the conditional pricing equation.
// Prices are ex-dividend. A finite asset pays at dates 1,...,T, then has price 0.
export function finiteDividendValue(r, remaining, dividend = 5) {
  return remaining <= 0 ? 0 : dividend * -Math.expm1(-remaining * Math.log1p(r)) / r;
}

export function bubbleScenario({ r = .05, initial = 20, survival = .9, terminal = 25, regime = 'cert', periods = 50, random = () => .5 } = {}) {
  if (!(r > 0 && initial >= 0 && survival > 0 && survival <= 1 && Number.isInteger(terminal) && terminal > 0 && ['cert', 'burst', 'fin'].includes(regime))) throw new RangeError('Invalid bubble illustration');
  const gross = 1 + r, infiniteValue = 5 / r, finite = regime === 'fin', end = finite ? terminal : periods;
  const fundamental = t => finite ? finiteDividendValue(r, terminal - t) : infiniteValue;
  let bubble = initial, crash = null;
  const prices = [], fundamentals = [], candidate = [], discountedExpected = [], candidateDiscounted = [];
  for (let t = 0; t <= end; t++) {
    const f = fundamental(t), discount = Math.exp(-t * Math.log1p(r));
    prices.push([t, f + (finite ? 0 : bubble)]); fundamentals.push([t, f]);
    candidate.push([t, f + initial * gross ** t]);
    // Conditional on date-zero information, not a realized discounted history.
    discountedExpected.push([t, discount * f + (finite ? 0 : initial)]);
    candidateDiscounted.push([t, discount * f + initial]);
    if (!finite && t < end && bubble > 0) {
      if (regime === 'cert') bubble *= gross;
      else if (random() < survival) bubble *= gross / survival;
      else { bubble = 0; crash = t + 1; }
    }
  }
  const price0 = fundamental(0) + (finite ? 0 : initial), nextFundamental = fundamental(1);
  const liveBubble = regime === 'burst' ? initial * gross / survival : finite ? 0 : initial * gross;
  const liveReturn = (nextFundamental + liveBubble + 5) / price0;
  const deadReturn = (nextFundamental + 5) / price0;
  const weight = regime === 'burst' ? survival : 1;
  const expectedReturn = weight * liveReturn + (1 - weight) * deadReturn;
  return { r, initial, survival, terminal, regime, gross, infiniteValue, end, prices, fundamentals, candidate, discountedExpected, candidateDiscounted, crash, price0, liveReturn, deadReturn, expectedReturn, weight, tailLimit: finite ? 0 : initial };
}

export function sampledBubbleReturn(scenario, random, draws = 20000) {
  if (scenario.regime !== 'burst' || scenario.initial === 0) return { draws: 0, survived: null, mean: scenario.expectedReturn, standardError: 0 };
  let survived = 0;
  for (let i = 0; i < draws; i++) if (random() < scenario.survival) survived++;
  return { draws, survived, mean: (survived * scenario.liveReturn + (draws - survived) * scenario.deadReturn) / draws,
    standardError: Math.sqrt(scenario.survival * (1 - scenario.survival) / draws) * (scenario.liveReturn - scenario.deadReturn) };
}
