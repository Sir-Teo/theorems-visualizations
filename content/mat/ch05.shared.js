// MAT5: declared finite models; constants below are authored examples, not material data.
export const R = 8.31446261815324;
const positive = (x, name) => { if (!(Number.isFinite(x) && x > 0)) throw new RangeError(name); return x; };
export function tensile(e, { E = 1000, y = 10, H = 30, brittle = false } = {}) {
  if (!(Number.isFinite(e) && e >= 0)) throw new RangeError('strain');
  const ey = y / E, p = brittle ? 0 : Math.max(0, (E * e - y) / (E + H));
  const stress = E * (e - p), elastic = stress * stress / (2 * E);
  const plastic = y * p + H * p * p / 2;
  return { stress, p, elastic, plastic, work: elastic + plastic, ey };
}
// a is horizontal semi-axis, b vertical. beta parametrizes (a cos beta,b sin beta).
export function ellipse(beta, ratio, loading = 'y') {
  positive(ratio, 'b/a');
  const c = Math.cos(beta) ** 2, s = Math.sin(beta) ** 2, k = ratio;
  const den = k * k * c + s;
  return loading === 'y' ? ((k * k + 2 * k) * c - s) / den : ((1 + 2 * k) * s - k * k * c) / den;
}
export function effectiveE(E, nu, mode) {
  positive(E, 'E'); if (!(Number.isFinite(nu) && nu > -1 && nu < .5)) throw new RangeError('nu');
  return mode === 'strain' ? E / (1 - nu * nu) : E;
}
// Central crack total length 2a; B cancels. Every length is SI metres here.
export function griffith(a, sigma, E, nu, gamma, plane = 'stress') {
  if (!(Number.isFinite(a) && a >= 0 && Number.isFinite(sigma) && sigma >= 0)) throw new RangeError('crack/load');
  positive(gamma, 'gamma'); const Ep = effectiveE(E, nu, plane);
  const surface = 4 * gamma * a, potential = -Math.PI * sigma * sigma * a * a / Ep;
  const G = Math.PI * sigma * sigma * a / Ep, resistance = 2 * gamma;
  return { Ep, surface, potential, total: surface + potential, G, resistance,
    critical: sigma > 0 ? resistance * Ep / (Math.PI * sigma * sigma) : Infinity };
}
// A separate compliance example C/C0=1+q²; energies divided by U0=P0²C0/2.
// Force=load*P0 or fixed displacement=load*P0*C0; surface energy/U0=2q.
// At q=0 the load/displacement have equal initial force. No infinite-plate identity is claimed.
export function compliance(q, load, mode = 'load') {
  if (!(q >= 0 && Number.isFinite(q) && load >= 0 && Number.isFinite(load))) throw new RangeError('compliance');
  const C = 1 + q * q, P = mode === 'load' ? load : load / C;
  const elastic = mode === 'load' ? -load * load * q * q : -load * load * q * q / C;
  const driving = 2 * P * P * q;
  return { C, P, elastic, surface: 2 * q, total: 2 * q + elastic, driving, resistance: 2 };
}
export function intensity(a, sigma, Y, E, nu, plane = 'stress', yieldStress = 500) {
  positive(a, 'a'); positive(Y, 'Y'); positive(yieldStress, 'yield');
  if (!(Number.isFinite(sigma) && sigma >= 0)) throw new RangeError('stress');
  // Input E/stress in MPa, a metres; K in MPa sqrt(m); G converted MPa*m -> J/m².
  const Ep = effectiveE(E, nu, plane), K = Y * sigma * Math.sqrt(Math.PI * a);
  const G = K * K / Ep * 1e6, rp = (K / yieldStress) ** 2 / (2 * Math.PI);
  return { K, G, Ep, rp, fraction: rp / a };
}
export function transition(T, mid, width, low = 10, high = 110) {
  positive(width, 'width'); return low + (high - low) * (1 + Math.tanh((T - mid) / width)) / 2;
}
export function transitionTemperature(E, mid, width, low = 10, high = 110) {
  if (!(E > low && E < high)) return null;
  return mid + width * Math.atanh(2 * (E - low) / (high - low) - 1);
}
export function survival(stress, m, volume, field = 'uniform', scale = 100) {
  positive(m, 'm'); positive(volume, 'volume'); positive(scale, 'scale');
  if (!(Number.isFinite(stress) && stress >= 0)) throw new RangeError('stress');
  // Rectangular beam: z uniform on [-1,1], tensile stress = stress*max(z,0).
  const effectiveVolume = field === 'bend' ? volume / (2 * (m + 1)) : volume;
  const hazard = effectiveVolume * (stress / scale) ** m;
  return { effectiveVolume, hazard, survival: Math.exp(-hazard), failure: -Math.expm1(-hazard) };
}
export function rng(seed) { let x = seed >>> 0; return () => { x = (Math.imul(1664525, x) + 1013904223) >>> 0; return (x + .5) / 4294967296; }; }
export function strengths(m, volume, field, seed, count = 200, scale = 100) {
  const ve = survival(0, m, volume, field, scale).effectiveVolume, rand = rng(seed);
  return Array.from({ length: count }, () => scale * (-Math.log(rand()) / ve) ** (1 / m));
}
export function basquin(N, coefficient, b, floor = 0) {
  positive(N, 'cycles'); positive(coefficient, 'coefficient'); if (!(Number.isFinite(b) && b < 0)) throw new RangeError('b');
  return Math.max(floor, coefficient * (2 * N) ** b);
}
export function fatigueLife(amplitude, coefficient, b, floor = 0) {
  positive(amplitude, 'amplitude'); positive(coefficient, 'coefficient'); if (!(Number.isFinite(b) && b < 0)) throw new RangeError('b');
  return amplitude <= floor ? Infinity : .5 * (amplitude / coefficient) ** (1 / b);
}
// Exact hardening + geometrical feedback model, dimensionless time u.
// rate = r0 [h+(1-h)exp(-u/tau)] exp(n*strain) at fixed load;
// fixed true stress removes exp(n*strain). Constant volume A/A0=exp(-strain).
export function creep(u, r0, n, mode = 'load', h = .2, tau = 2) {
  if (!(Number.isFinite(u) && u >= 0)) throw new RangeError('time'); positive(r0, 'rate'); positive(n, 'exponent');
  const integral = r0 * (h * u - (1 - h) * tau * Math.expm1(-u / tau));
  const baseRate = r0 * (h + (1 - h) * Math.exp(-u / tau));
  const den = mode === 'load' ? 1 - n * integral : 1;
  if (!(den > 0)) return { valid: false, integral, den };
  const strain = mode === 'load' ? -Math.log1p(-n * integral) / n : integral;
  return { valid: true, strain, rate: baseRate / den, area: Math.exp(-strain), integral, den };
}
export function creepHorizon(r0, n, h = .2, tau = 2) {
  let lo = 0, hi = 1 / (n * r0 * h);
  for (let k = 0; k < 80; k++) { const u = (lo + hi) / 2; if (creep(u, r0, n, 'load', h, tau).valid) lo = u; else hi = u; }
  return (lo + hi) / 2;
}
export function powerLog10(stress, T, n, Q = 150000) {
  positive(stress, 'stress'); positive(T, 'T');
  return -6 + n * Math.log10(stress / 100) - Q / (R * Math.LN10) * (1 / T - 1 / 900);
}
export function ruptureLog10(stress, T, C = 20) {
  positive(stress, 'stress'); positive(T, 'T');
  const parameter = 24000 - 2000 * Math.log(stress / 100);
  return { parameter, logTime: parameter / T - C };
}
export const mechanismNames = ['lattice diffusion', 'boundary diffusion', 'dislocation creep', 'activated glide'];
export function mechanisms(theta, logStress, grain) {
  positive(theta, 'T/Tm'); positive(grain, 'd/b');
  const s = 10 ** logStress, Ls = Math.log(s / .001), Ld = Math.log(grain / 1e4), delta = 1 / theta - 1 / .6;
  const logs = [Math.log(1e-7) + Ls - 2 * Ld - 8 * delta,
    Math.log(2e-7) + Ls - 3 * Ld - 5 * delta,
    Math.log(1e-8) + 4 * Ls - 10 * delta,
    -30 / theta * Math.max(0, 1 - s / .02) ** 2];
  const best = Math.max(...logs), active = logs[2] >= logs[3] ? 2 : 3;
  // Diffusion paths add; glide and climb-assisted dislocation creep are alternatives.
  const weights = logs.map((x,i) => i < 2 || i === active ? Math.exp(x - best) : 0), z = weights.reduce((a, b) => a + b, 0);
  return { logs, log10Total: (best + Math.log(z)) / Math.LN10, shares: weights.map(w => w / z), dominant: logs.indexOf(best), s };
}
// Marching squares, drawn in the actual (theta,log stress) coordinates.
export function contour(f, level, nx = 32, ny = 40) {
  const pieces = [], x0 = .3, x1 = .95, y0 = -5, y1 = Math.log10(.03);
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const corners = [[x0 + (x1-x0)*i/nx,y0+(y1-y0)*j/ny],[x0+(x1-x0)*(i+1)/nx,y0+(y1-y0)*j/ny],[x0+(x1-x0)*(i+1)/nx,y0+(y1-y0)*(j+1)/ny],[x0+(x1-x0)*i/nx,y0+(y1-y0)*(j+1)/ny]];
    const values = corners.map(p => f(...p) - level), crossings = [];
    for (let e = 0; e < 4; e++) { const k=(e+1)%4,a=values[e],b=values[k]; if ((a<0)!==(b<0)) { let lo=0,hi=1; for(let n=0;n<28;n++){const t=(lo+hi)/2,point=corners[e].map((v,d)=>v+t*(corners[k][d]-v)),value=f(...point)-level;if((value<0)===(a<0))lo=t;else hi=t;}const t=(lo+hi)/2;crossings.push(corners[e].map((v,d)=>v+t*(corners[k][d]-v))); } }
    for(let e=0;e+1<crossings.length;e+=2)pieces.push([crossings[e],crossings[e+1]]);
  }
  return pieces;
}
