// Two-tissue ODE, with explicit plasma input and no tissue tracer at t=0.
// C1,C2 in kBq/g; Cp in kBq/mL; K1 in mL/g/min; other rates in min^-1.
export const patlakPlasmaAudit = t => t <= 0 ? 0 : (1 - Math.exp(-5 * t)) * (55 * Math.exp(-0.9 * t) + 7 * Math.exp(-0.1 * t) + 4.5 * Math.exp(-0.0045 * t));
export const patlakInputIntegralAudit = t => [ [55, 0.9], [7, 0.1], [4.5, 0.0045] ].reduce((s, [a, b]) => s + a * (-Math.expm1(-b * t) / b + Math.expm1(-(b + 5) * t) / (b + 5)), 0);
export function patlakModelAudit(K1, k2, k3, k4, Vp = 0.04, tEnd = 90, dt = 0.025) {
  const n = Math.round(tEnd / dt) + 1, t = new Float64Array(n), cp = new Float64Array(n), ct = new Float64Array(n), c1 = new Float64Array(n), c2 = new Float64Array(n), cum = new Float64Array(n);
  const deriv = (u, x, y) => [K1 * patlakPlasmaAudit(u) - (k2 + k3) * x + k4 * y, k3 * x - k4 * y];
  for (let i = 0; i < n; i++) {
    const u = i * dt; t[i] = u; cp[i] = patlakPlasmaAudit(u); cum[i] = patlakInputIntegralAudit(u); ct[i] = c1[i] + c2[i] + Vp * cp[i];
    if (i + 1 === n) break;
    const a = deriv(u, c1[i], c2[i]), b = deriv(u + dt / 2, c1[i] + dt * a[0] / 2, c2[i] + dt * a[1] / 2), c = deriv(u + dt / 2, c1[i] + dt * b[0] / 2, c2[i] + dt * b[1] / 2), d = deriv(u + dt, c1[i] + dt * c[0], c2[i] + dt * c[1]);
    c1[i + 1] = c1[i] + dt * (a[0] + 2 * b[0] + 2 * c[0] + d[0]) / 6;
    c2[i + 1] = c2[i] + dt * (a[1] + 2 * b[1] + 2 * c[1] + d[1]) / 6;
  }
  return { t, cp, ct, c1, c2, cum, n, dt };
}
export function patlakFrameAudit(m, time) {
  const q = Math.max(0, Math.min(m.n - 1, time / m.dt)), i = Math.floor(q), j = Math.min(i + 1, m.n - 1), f = q - i;
  const interp = a => a[i] * (1 - f) + a[j] * f;
  return { cp: patlakPlasmaAudit(time), cum: patlakInputIntegralAudit(time), ct: interp(m.ct) };
}
