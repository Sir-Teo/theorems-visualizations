// Chosen teaching parameters for the displayed left-heart model; not fitted participant data.
export const OUTPUT_PRESETS = {
  healthy: { hr: 75 },
  failing: { Ees: 1, V0: 40, Pv: 12, R: 1.5, hr: 90 },
  athlete: { Ees: 3.4, V0: 10, A: .15, B: .028, Pv: 11, R: 1, hr: 52 },
  stiff: { Ees: 4.2, V0: 10, A: 1.2, B: .04, Pv: 12, R: 1.5, hr: 85 },
};
export function integrateSamples(t, values) {
  let total = 0;
  for (let i = 1; i < t.length; i++) total += (t[i] - t[i - 1]) * (values[i] + values[i - 1]) / 2;
  return total;
}
export const outputMetrics = (EDV, ESV, HR) => ({ SV: EDV - ESV, EF: (EDV - ESV) / EDV, CO: (EDV - ESV) * HR / 1000 });
