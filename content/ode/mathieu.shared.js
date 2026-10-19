// Two-column RK4 fundamental matrix for y'' + c*y' + (delta+epsilon*cos t)*y=0.
// Fixed-size scratch storage avoids allocating nested matrices for every raster pixel.
export function mathieuFloquet(delta, epsilon, damping = 0, steps = 64) {
  const T = 2 * Math.PI, h = T / steps;
  const x = new Float64Array([1, 0, 0, 1]), tmp = new Float64Array(4);
  const k1 = new Float64Array(4), k2 = new Float64Array(4), k3 = new Float64Array(4), k4 = new Float64Array(4);
  const f = (q, v, out) => { out[0] = v[2]; out[1] = v[3]; out[2] = -q * v[0] - damping * v[2]; out[3] = -q * v[1] - damping * v[3]; };
  for (let i = 0; i < steps; i++) {
    const q0 = delta + epsilon * Math.cos(i * h), qm = delta + epsilon * Math.cos((i + .5) * h), q1 = delta + epsilon * Math.cos((i + 1) * h);
    f(q0, x, k1);
    for (let j = 0; j < 4; j++) tmp[j] = x[j] + h * k1[j] / 2;
    f(qm, tmp, k2);
    for (let j = 0; j < 4; j++) tmp[j] = x[j] + h * k2[j] / 2;
    f(qm, tmp, k3);
    for (let j = 0; j < 4; j++) tmp[j] = x[j] + h * k3[j];
    f(q1, tmp, k4);
    for (let j = 0; j < 4; j++) x[j] += h * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]) / 6;
  }
  const trace = x[0] + x[3], determinant = x[0] * x[3] - x[1] * x[2], discriminant = trace * trace - 4 * determinant;
  const radius = discriminant >= 0 ? (Math.abs(trace) + Math.sqrt(discriminant)) / 2 : Math.sqrt(determinant);
  return { matrix: [[x[0], x[1]], [x[2], x[3]]], trace, determinant, growth: Math.log(radius) / T };
}
