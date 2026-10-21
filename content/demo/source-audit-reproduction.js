// Authored constant-within-interval hazard reconstruction from abridged survivorship.
// Official person-years Lx are a separate grouped reference, not forced to equal this interpolation.
export function reproductionSurvival(ages, survivors, age, multiplier = 1) {
  if (!(multiplier >= 0)) throw new RangeError('A nonnegative hazard multiplier is required.');
  if (multiplier === 0) return 1;
  if (age <= ages[0]) return (survivors[0] / survivors[0]) ** multiplier;
  let i = 0; while (i + 1 < ages.length && age > ages[i + 1]) i++;
  if (i + 1 === ages.length) return (survivors[i] / survivors[0]) ** multiplier;
  const u = (age - ages[i]) / (ages[i + 1] - ages[i]);
  return Math.exp(multiplier * ((1 - u) * Math.log(survivors[i] / survivors[0]) + u * Math.log(survivors[i + 1] / survivors[0])));
}

export function reproductionExposure(startSurvival, endSurvival, years, multiplier) {
  if (!(startSurvival > 0 && startSurvival <= 1 && endSurvival > 0 && endSurvival <= startSurvival && years > 0 && multiplier >= 0)) throw new RangeError('Positive decreasing survival, interval length and nonnegative hazard multiplier are required.');
  if (multiplier === 0) return years;
  const z = multiplier * Math.log(startSurvival / endSurvival);
  return years * startSurvival ** multiplier * (z === 0 ? 1 : -Math.expm1(-z) / z);
}

export function reproductionRates({ ages, survivors, personYears, fertilityAges, fertility, boysPer100Girls, multiplier }) {
  if (!(boysPer100Girls >= 0) || fertility.some(f => !(f >= 0))) throw new RangeError('Nonnegative fertility and birth-sex ratio are required.');
  const radix = survivors[0], daughterShare = 100 / (100 + boysPer100Girls), gross = fertility.map(f => daughterShare * f);
  const exposure = fertilityAges.map(age => {
    const i = ages.indexOf(age);
    if (i < 0 || ages[i + 1] !== age + 5) throw new RangeError('Fertility intervals must match the five-year life-table knots.');
    return reproductionExposure(survivors[i] / radix, survivors[i + 1] / radix, 5, multiplier);
  });
  const net = multiplier === 0 ? [...gross] : gross.map((g, i) => g * exposure[i] / 5);
  const GRR = 5 * gross.reduce((a, b) => a + b, 0), NRR = 5 * net.reduce((a, b) => a + b, 0);
  const grouped = gross.reduce((sum, g, j) => sum + g * personYears[ages.indexOf(fertilityAges[j])] / radix, 0);
  const baselineExposure = fertilityAges.map(age => { const i = ages.indexOf(age);return reproductionExposure(survivors[i] / radix, survivors[i + 1] / radix, 5, 1); });
  const reconstructedBaseline = gross.reduce((sum, g, j) => sum + g * baselineExposure[j], 0);
  const curveAges = [...new Set([...ages, ...Array.from({ length: 401 }, (_, i) => i / 4)])].sort((a, b) => a - b);
  return { daughterShare, gross, net, exposure, GRR, NRR, loss: GRR - NRR, grouped, reconstructedBaseline,
    survival30: reproductionSurvival(ages, survivors, 30, multiplier),
    adjustedCurve: curveAges.map(age => [age, reproductionSurvival(ages, survivors, age, multiplier)]),
    baselineCurve: curveAges.map(age => [age, reproductionSurvival(ages, survivors, age, 1)]),
    knots: ages.map((age, i) => [age, survivors[i] / radix]) };
}
