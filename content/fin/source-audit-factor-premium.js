// Mehra (2003), NBER w9525, printed pp. 23–28, equations (18)–(21).
// Historical arithmetic means are targets, not generated observations.
export const PREMIUM_REFERENCE = Object.freeze({ equity: 0.0698, riskless: 0.008, premium: 0.0618, consumptionMean: 0.018, consumptionSd: 0.036 });

export function premiumScenario({ premium = 0.0618, consumptionSd = 0.036, stockLogSd = 0.2, rho = 0.3, beta = 0.99 } = {}) {
  if (!(premium > 0 && consumptionSd > 0 && stockLogSd > 0 && rho > 0 && rho <= 1 && beta > 0 && beta <= 1)) throw new RangeError('Positive scales, 0 < rho <= 1 and 0 < beta <= 1 required');
  const grossGrowth = 1 + PREMIUM_REFERENCE.consumptionMean;
  // Match arithmetic growth mean and standard deviation to a lognormal law.
  const variance = Math.log1p((consumptionSd / grossGrowth) ** 2);
  const logSd = Math.sqrt(variance), logMean = Math.log(grossGrowth) - variance / 2;
  const target = Math.log1p(premium / (1 + PREMIUM_REFERENCE.riskless));
  const covariance = rho * logSd * stockLogSd;
  const gamma = target / covariance, consumptionGamma = target / variance;
  const logRiskless = (g) => -Math.log(beta) + g * logMean - g * g * variance / 2;
  const riskless = (g) => Math.expm1(logRiskless(g));
  const maxGamma = Math.max(60, Math.ceil(1.12 * Math.max(gamma, consumptionGamma) / 10) * 10);
  const peakGamma = Math.min(maxGamma, logMean / variance);
  // A positive finite PERPETUAL consumption claim additionally needs
  // q = beta E[G^(1-gamma)] < 1; the pricing identity alone is insufficient.
  const root = Math.sqrt(logMean * logMean - 2 * variance * Math.log(beta));
  const claimDomain = [1 + (logMean - root) / variance, 1 + (logMean + root) / variance];
  const claimLogDiscount = (g) => Math.log(beta) + (1 - g) * logMean + (1 - g) ** 2 * variance / 2;
  return { variance, logSd, logMean, target, covariance, gamma, consumptionGamma, maxGamma, peakGamma, logRiskless, riskless, claimDomain, claimLogDiscount };
}

// Ordinary-probability teaching model, not Benartzi–Thaler's CRSP bootstrap
// with cumulative probability weights. Split gains/losses and substitute u=t²:
// E[(Z+d)_+^a] = integral 2 t^(2a+1) phi(t²-d) dt, t >= 0.
// Sixteen-point Gauss–Legendre over 24 panels; omitted normal tail is >12 sd.
const GX = [0.09501250983763744, 0.2816035507792589, 0.4580167776572274, 0.6178762444026438, 0.755404408355003, 0.8656312023878318, 0.9445750230732326, 0.9894009349916499];
const GW = [0.1894506104550685, 0.1826034150449236, 0.16915651939500254, 0.14959598881657673, 0.12462897125553387, 0.09515851168249279, 0.06225352393864789, 0.027152459411754095];
export function normalProspectParts(d, alpha) {
  if (!(Number.isFinite(d) && alpha >= 0.5 && alpha <= 1)) throw new RangeError('Finite displacement and 0.5 <= alpha <= 1 required');
  const upper = Math.sqrt(Math.abs(d) + 12), step = upper / 24;
  let gain = 0, loss = 0;
  for (let p = 0; p < 24; p++) {
    const mid = (p + 0.5) * step, half = step / 2;
    for (let j = 0; j < GX.length; j++) for (const sign of [-1, 1]) {
      const t = mid + sign * half * GX[j], u = t * t;
      const scale = half * GW[j] * 2 * t ** (2 * alpha + 1) / Math.sqrt(2 * Math.PI);
      gain += scale * Math.exp(-((u - d) ** 2) / 2);
      loss += scale * Math.exp(-((u + d) ** 2) / 2);
    }
  }
  return { gain, loss };
}

export function prospectValue(h, premium, stockSd, alpha, lambda) {
  if (!(h > 0 && premium > 0 && stockSd > 0 && lambda >= 1)) throw new RangeError('Positive horizon, premium, volatility and lambda >= 1 required');
  const scale = stockSd * Math.sqrt(h), { gain, loss } = normalProspectParts(premium * Math.sqrt(h) / stockSd, alpha);
  return scale ** alpha * (gain - lambda * loss);
}

export function prospectHorizon(premium, stockSd, alpha, lambda) {
  if (!(premium > 0 && stockSd > 0 && lambda >= 1)) throw new RangeError('Positive premium, volatility and lambda >= 1 required');
  if (lambda === 1) return 0;
  // v is strictly increasing, hence this shifted-normal expectation is too.
  let lo = 0, hi = 1;
  const value = (d) => { const p = normalProspectParts(d, alpha); return p.gain - lambda * p.loss; };
  while (value(hi) < 0 && hi < 32) hi *= 2;
  for (let i = 0; i < 55; i++) { const mid = (lo + hi) / 2; if (value(mid) < 0) lo = mid; else hi = mid; }
  return (((lo + hi) / 2) * stockSd / premium) ** 2;
}
