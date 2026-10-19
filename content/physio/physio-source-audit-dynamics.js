// Exact periodic solution of C Pw'=Q-(Pw-Pv)/R for half-sine ejection.
// Parameters are mL, mmHg, s. Zc is an added series resistor: mean P uses R+Zc.
export function periodicWindkessel({ R = 1.05, C = 1.5, HR = 75, SV = 70, Pv = 0, Zc = 0, tsFrac = .35 } = {}) {
  const T = 60 / HR, Ts = tsFrac * T, k = 1 / (R * C), w = Math.PI / Ts;
  const Qpk = SV * Math.PI / (2 * Ts), a = Math.exp(-k * Ts), b = Math.exp(-k * (T - Ts));
  const B = Qpk / (C * (k * k + w * w));
  const p0 = b * B * w * (1 + a) / -Math.expm1(-k * T), pes = p0 * a + B * w * (1 + a);
  const flowAt = t => t > 0 && t < Ts ? Qpk * Math.sin(w * t) : 0;
  const chamberAt = t => Pv + (t <= Ts ? p0 * Math.exp(-k * t) + B * (k * Math.sin(w * t) - w * Math.cos(w * t) + w * Math.exp(-k * t)) : pes * Math.exp(-k * (t - Ts)));
  const pressureAt = t => chamberAt(t) + Zc * flowAt(t);
  const derivative = t => (flowAt(t) - (chamberAt(t) - Pv) / R) / C + Zc * Qpk * w * Math.cos(w * t);
  // Locate smooth systolic extrema; include one-sided endpoints, which may be corners.
  const critical = [0, Ts, T];
  for (let j = 0; j < 256; j++) {
    let lo = Ts * j / 256, hi = Ts * (j + 1) / 256;
    if (derivative(lo) * derivative(hi) < 0) {
      const sign = Math.sign(derivative(lo));
      for (let z = 0; z < 55; z++) { const m = (lo + hi) / 2; if (Math.sign(derivative(m)) === sign) lo = m; else hi = m; }
      critical.push((lo + hi) / 2);
    }
  }
  const t = [...new Set([...Array.from({ length: 421 }, (_, j) => T * j / 420), Ts, ...critical])].sort((u,v) => u-v);
  const Q = t.map(flowAt), Pw = t.map(chamberAt), P = t.map(pressureAt);
  const values = critical.map(pressureAt), Ps = Math.max(...values), Pd = Math.min(...values);
  return { T, Ts, t, Q, Pw, P, Ps, Pd, PP: Ps - Pd, Pm: Pv + (R + Zc) * SV / T,
    Qmean: SV / T, flowAt, chamberAt, pressureAt, P0: Pv + p0, Pes: Pv + pes };
}
export const pulseShape = (t, duration = .3) => t > 0 && t < duration ? Math.sin(Math.PI * t / duration) ** 2 : 0;
export const waveSpeed = (megaPascals, density = 1060) => Math.sqrt(megaPascals * 1e6 * .1 / (2 * density));
export function pulsePeak(delay, reflection, duration = .3) {
  const k = 2 * Math.PI / duration, cuts = [...new Set([0, duration, delay, delay + duration])].sort((a,b) => a-b), candidates = [...cuts];
  for (let j = 0; j < cuts.length - 1; j++) {
    const lo = cuts[j], hi = cuts[j + 1], mid = (lo + hi) / 2;
    const active = [[0, 1], [delay, reflection]].filter(([d]) => mid > d && mid < d + duration);
    const A = active.reduce((s,[d,g]) => s + g * Math.cos(k*d), 0), B = active.reduce((s,[d,g]) => s + g * Math.sin(k*d), 0);
    if (Math.hypot(A,B) > 1e-14) {
      const theta = Math.atan2(B,A);
      for (let n = Math.floor((k*lo-theta)/Math.PI)-1; n <= Math.ceil((k*hi-theta)/Math.PI)+1; n++) {
        const t = (theta+n*Math.PI)/k; if (t > lo && t < hi) candidates.push(t);
      }
    }
  }
  let value = -Infinity, time = 0;
  for (const t of candidates) { const y = pulseShape(t,duration) + reflection*pulseShape(t-delay,duration); if (y>value) {value=y;time=t;} }
  return { value, time };
}
