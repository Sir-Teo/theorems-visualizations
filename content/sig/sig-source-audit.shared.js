// Fourier coefficients of the periodic linear interpolant through equally spaced knots t_j=-pi+2pi*j/N.
export function linearPeriodicSpectrum(ys, K) {
  const N = ys.length, re = new Float64Array(K + 1), im = new Float64Array(K + 1);
  for (let k = 0; k <= K; k++) {
    let a = 0, b = 0;
    for (let j = 0; j < N; j++) { const t = -Math.PI + 2 * Math.PI * j / N; a += ys[j] * Math.cos(k * t); b -= ys[j] * Math.sin(k * t); }
    const u = Math.PI * k / N, sinc = k ? Math.sin(u) / u : 1;
    re[k] = a / N * sinc * sinc; im[k] = b / N * sinc * sinc;
  }
  let power = 0;
  for (let j = 0; j < N; j++) { const a = ys[j], b = ys[(j + 1) % N]; power += (a * a + a * b + b * b) / (3 * N); }
  return { re, im, K, power };
}

export const HARMONIC_EULER = 0.5772156649015329;
export function harmonic(n) {
  if (n <= 2e6) { let sum = 0; for (let k = n; k >= 1; k--) sum += 1 / k; return sum; }
  return Math.log(n) + HARMONIC_EULER + 1 / (2 * n) - 1 / (12 * n * n);
}
export const divergenceBound = Math.PI ** 3 / 6;
// Fejer weights keep the sine series in [-pi/2,pi/2], so every modulated block is bounded by pi.
export const divergenceBlockPeak = n => harmonic(n) - n / (n + 1);
export function divergenceAssemblyPeak(j) {
  const logn = j ** 3 * Math.LN2;
  const H = j <= 2 ? harmonic(2 ** (j ** 3)) : logn + HARMONIC_EULER;
  const correction = j <= 2 ? (2 ** (j ** 3)) / (2 ** (j ** 3) + 1) : 1;
  return (H - correction) / (j * j);
}
