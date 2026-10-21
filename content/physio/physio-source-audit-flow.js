// Unit-explicit teaching models: diameter mm, viscosity mPa s, speed m/s.
export const reynolds = (diameter, speed, viscosity, density = 1060) => density * speed * diameter / viscosity;
// Restrict isoreynolds lines to the positive log-map rectangle instead of clipping samples.
export function reynoldsLine(re, viscosity, x = [.005, 50], y = [1e-4, 10], density = 1060) {
  const k = re * viscosity / density;
  return { lo: Math.max(x[0], k / y[1]), hi: Math.min(x[1], k / y[0]), speed: diameter => k / diameter };
}
export const BERNOULLI_MMHG = 1060 / (2 * 133.322);
export function stenosisFlow(reduction, flow, recovery, radius = 1.2) {
  const A1 = Math.PI * radius ** 2, A2 = A1 * (1 - reduction / 100), v1 = flow / A1 / 100, v2 = flow / A2 / 100;
  const exact = BERNOULLI_MMHG * (v2 ** 2 - v1 ** 2), proximal = BERNOULLI_MMHG * v1 ** 2;
  const rounded = 4 * (v2 ** 2 - v1 ** 2), simplified = 4 * v2 ** 2;
  return { A1, A2, v1, v2, exact, proximal, rounded, simplified, rounding: rounded - exact,
    proximalRounded: simplified - rounded, loss: exact * (1 - recovery / 100) };
}
