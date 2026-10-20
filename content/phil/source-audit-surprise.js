// Authored six-world model: exactly one exam on days1–5, or no exam that week.
// Public weights are fixed before the week. The only new observation is no earlier exam.
export function surprisePrior(weights, morning) {
  if (weights.length !== 6 || weights.some(w => !(w >= 0 && Number.isFinite(w))) || !Number.isInteger(morning) || morning < 1 || morning > 5) throw new RangeError('Six finite nonnegative weights and a morning1–5 are required.');
  const total = weights.reduce((a, b) => a + b, 0);
  if (!Number.isFinite(total)) throw new RangeError('The total weight must be finite.');
  let latest = -1; for (let d = 0; d < 5; d++) if (weights[d] > 0) latest = d;
  if (total === 0) return { total, prior: null, posterior: null, historyMass: null, today: null, certainToday: false, latest,
    hazards: Array(5).fill(null), certainExam: Array(5).fill(false), certaintyMass: null, examProbability: null, guaranteesExam: false };
  const prior = weights.map(w => w / total), hazards = [], certainExam = [];
  for (let d = 0; d < 5; d++) {
    const remaining = weights.slice(d, 5).reduce((a, b) => a + b, weights[5]);
    hazards.push(remaining > 0 ? weights[d] / remaining : null);
    // Use support, not rounded probabilities or epsilon thresholds, for certainty.
    certainExam.push(weights[d] > 0 && weights[5] === 0 && weights.slice(d + 1, 5).every(w => w === 0));
  }
  const d = morning - 1, surviving = weights.map((w, i) => i < d ? 0 : w), remaining = surviving.reduce((a, b) => a + b, 0);
  const posterior = remaining > 0 ? surviving.map(w => w / remaining) : null;
  return { total, prior, posterior, historyMass: remaining / total, today: posterior ? posterior[d] : null, certainToday: remaining > 0 && certainExam[d], latest,
    hazards, certainExam, certaintyMass: prior.slice(0, 5).reduce((a, p, i) => a + (certainExam[i] ? p : 0), 0),
    examProbability: prior.slice(0, 5).reduce((a, p) => a + p, 0), guaranteesExam: weights[5] === 0 };
}
export function removeLatestExam(weights) {
  if (weights.length !== 6 || weights.some(w => !(w >= 0 && Number.isFinite(w)))) throw new RangeError('Six finite nonnegative weights are required.');
  const result = [...weights];
  for (let d = 4; d >= 0; d--) if (result[d] > 0) { result[d] = 0; break; }
  return result;
}
