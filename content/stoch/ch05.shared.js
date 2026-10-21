// Finite, directly computed models for coupling and mixing. No fitted decay curves.
export const uniform = n => Array(n).fill(1 / n);
export const pointMass = (n, x) => Array.from({ length: n }, (_, i) => +(i === x));
export const totalVariation = (a, b) => a.reduce((sum, x, i) => sum + Math.abs(x - b[i]), 0) / 2;
export function advance(mu, P) {
  return P.map((_, j) => mu.reduce((sum, x, i) => sum + x * P[i][j], 0));
}
export function cycleKernel(n, lazy = .5) {
  return Array.from({ length: n }, (_, i) => {
    const row = Array(n).fill(0); row[i] += lazy;
    row[(i + 1) % n] += (1 - lazy) / 2; row[(i + n - 1) % n] += (1 - lazy) / 2;
    return row;
  });
}
export function pathKernel(n) {
  return Array.from({ length: n }, (_, i) => {
    const row = Array(n).fill(0); row[i] += .5;
    row[Math.max(0, i - 1)] += .25; row[Math.min(n - 1, i + 1)] += .25;
    return row;
  });
}
export function roomKernel(m, crossing) {
  return Array.from({ length: 2 * m }, (_, i) => Array.from({ length: 2 * m }, (_, j) =>
    (Math.floor(i / m) === Math.floor(j / m) ? 1 - crossing : crossing) / m));
}
export function finiteKernel(kind, n = 6, crossing = .06) {
  return kind === 'path' ? pathKernel(n) : kind === 'rooms' ? roomKernel(n / 2, crossing) : cycleKernel(n, kind === 'periodic' ? 0 : .5);
}
export function mixingProfile(P, horizon, pi = uniform(P.length)) {
  let rows = P.map((_, i) => pointMass(P.length, i));
  const d = [], pair = [], powers = [];
  for (let t = 0; t <= horizon; t++) {
    powers.push(rows); d.push(Math.max(...rows.map(mu => totalVariation(mu, pi))));
    let worst = 0;
    for (let x = 0; x < P.length; x++) for (let y = x + 1; y < P.length; y++) worst = Math.max(worst, totalVariation(rows[x], rows[y]));
    pair.push(worst); rows = rows.map(mu => advance(mu, P));
  }
  return { d, pair, powers, mixingTime: d.findIndex(x => x <= .25) };
}
export function distributionPair(shift = .4) {
  const mu = [.05, .15, .4, .3, .1], target = [.4, .3, .1, .05, .15];
  return { mu, nu: mu.map((x, i) => (1 - shift) * x + shift * target[i]) };
}
export function couplingMatrix(mu, nu, kind = 'maximal') {
  const n = mu.length;
  if (kind === 'independent') return mu.map(x => nu.map(y => x * y));
  if (kind === 'quantile') {
    const a = [0], b = [0];
    mu.forEach(x => a.push(a.at(-1) + x)); nu.forEach(x => b.push(b.at(-1) + x));
    return mu.map((_, i) => nu.map((__, j) => Math.max(0, Math.min(a[i + 1], b[j + 1]) - Math.max(a[i], b[j]))));
  }
  const common = mu.map((x, i) => Math.min(x, nu[i])), rest = totalVariation(mu, nu);
  return mu.map((x, i) => nu.map((y, j) => (i === j ? common[i] : 0) + (rest > 0 ? (x - common[i]) * (y - common[j]) / rest : 0)));
}
export const disagreement = C => C.reduce((sum, row, i) => sum + row.reduce((s, x, j) => s + (i === j ? 0 : x), 0), 0);
// Markovian product coupling off the diagonal, identical moves on the diagonal.
export function stickyPairStep(law, P) {
  const n = P.length, next = Array.from({ length: n }, () => Array(n).fill(0));
  for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) {
    const mass = law[x][y]; if (!mass) continue;
    if (x === y) for (let z = 0; z < n; z++) next[z][z] += mass * P[x][z];
    else for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) next[a][b] += mass * P[x][a] * P[y][b];
  }
  return next;
}
export function stickyTail(P, horizon, stationaryStart = true) {
  const n = P.length, pi = uniform(n);
  let law = Array.from({ length: n }, (_, x) => Array.from({ length: n }, (_, y) => x === 0 ? (stationaryStart ? pi[y] : +(y === Math.floor(n / 2))) : 0));
  const tail = [];
  for (let t = 0; t <= horizon; t++) { tail.push(disagreement(law)); law = stickyPairStep(law, P); }
  return tail;
}
// Distances for a transitive lazy cycle need just one starting row.
export function cycleMixing(n, horizon) {
  let law = pointMass(n, 0); const target = uniform(n), d = [];
  for (let t = 0; t <= horizon; t++) {
    d.push(totalVariation(law, target));
    if (t === horizon) break;
    law = law.map((x, j) => .5 * x + .25 * (law[(j + 1) % n] + law[(j + n - 1) % n]));
  }
  return { d, law, mixingTime: d.findIndex(x => x <= .25) };
}
export function binomialLaw(n) {
  const p = Array(n + 1).fill(0); p[0] = 2 ** -n;
  for (let k = 0; k < n; k++) p[k + 1] = p[k] * (n - k) / (k + 1);
  return p;
}
// Exact weight aggregation of coordinate-refresh walk from the all-zero vertex.
export function cubeMixing(n, horizon) {
  let law = pointMass(n + 1, 0), seen = pointMass(n + 1, 0);
  const stationary = binomialLaw(n), d = [], couponTail = [], upper = [];
  for (let t = 0; t <= horizon; t++) {
    d.push(totalVariation(law, stationary)); couponTail.push(1 - seen[n]);
    // LPW Example12.19: 4 TV² <= (1+exp(-2t/n))^n-1.
    upper.push(Math.min(1, .5 * Math.sqrt(Math.expm1(n * Math.log1p(Math.exp(-2 * t / n))))));
    if (t === horizon) break;
    const next = Array(n + 1).fill(0), marked = Array(n + 1).fill(0);
    for (let k = 0; k <= n; k++) {
      next[k] += law[k] / 2;
      if (k > 0) next[k - 1] += law[k] * k / (2 * n);
      if (k < n) next[k + 1] += law[k] * (n - k) / (2 * n);
      marked[k] += seen[k] * k / n;
      if (k < n) marked[k + 1] += seen[k] * (n - k) / n;
    }
    law = next; seen = marked;
  }
  return { d, couponTail, upper, stationary, law, mixingTime: d.findIndex(x => x <= .25) };
}
export function bottleneck(P, pi = uniform(P.length)) {
  const n = P.length; let best = Infinity, bestMask = 0;
  for (let mask = 1; mask < 2 ** n - 1; mask++) {
    let mass = 0, flow = 0;
    for (let x = 0; x < n; x++) if (mask & (1 << x)) {
      mass += pi[x];
      for (let y = 0; y < n; y++) if (!(mask & (1 << y))) flow += pi[x] * P[x][y];
    }
    if (mass <= .5 + 1e-14 && flow / mass < best) { best = flow / mass; bestMask = mask; }
  }
  return { phi: best, mask: bestMask, lowerBound: 1 / (4 * best) };
}
export function cubeStatistic(n, t) {
  const a = (1 - 1 / n) ** t, b = (1 - 2 / n) ** t;
  const mean = n * a, variance = Math.max(0, n + n * (n - 1) * b - n * n * a * a);
  // Event S > mean/2 separates transient from stationary law.
  const lower = mean === 0 ? 0 : Math.max(0, 1 - 4 * (variance + n) / (mean * mean));
  return { mean, variance, stationaryVariance: n, lower };
}
export function randomBits(seed, count) {
  let state = seed >>> 0; const bits = [];
  for (let k = 0; k < count; k++) { state = (Math.imul(1664525, state) + 1013904223) >>> 0; bits.push(state >>> 31); }
  return bits;
}
export function pathTrajectories(n, seed, horizon, sameNoise = true) {
  const noise = randomBits(seed, 2 * horizon); let x = 0, y = n - 1;
  const a = [x], b = [y]; let meeting = null;
  for (let t = 0; t < horizon; t++) {
    const dx = noise[2 * t] ? 1 : -1, dy = sameNoise || x === y ? dx : noise[2 * t + 1] ? 1 : -1;
    x = Math.max(0, Math.min(n - 1, x + dx)); y = Math.max(0, Math.min(n - 1, y + dy));
    a.push(x); b.push(y); if (meeting === null && x === y) meeting = t + 1;
  }
  return { a, b, meeting };
}
export function cftp(n, seed, maxExponent = 10) {
  // maps[k] is the fixed map at time -(k+1). Increasing the horizon retains it.
  const maps = randomBits(seed, 2 ** maxExponent), attempts = [];
  for (let exponent = 0; exponent <= maxExponent; exponent++) {
    const T = 2 ** exponent, states = Array.from({ length: n }, (_, x) => x), paths = states.map(x => [x]);
    for (let k = T - 1; k >= 0; k--) for (let x = 0; x < n; x++) {
      states[x] = Math.max(0, Math.min(n - 1, states[x] + (maps[k] ? 1 : -1))); paths[x].push(states[x]);
    }
    const coalesced = states.every(x => x === states[0]); attempts.push({ T, states, paths, coalesced });
    if (coalesced) return { complete: true, output: states[0], maps, attempts };
  }
  return { complete: false, output: null, maps, attempts };
}
export function memoOne() {
  let previous, value;
  return (key, compute) => { if (key !== previous) { value = compute(); previous = key; } return value; };
}
export function probabilityStage(v, horizon, title = 'distance from equilibrium') {
  return v.stage({ x: [-.04 * horizon, 1.04 * horizon], y: [-.06, 1.08], height: 290,
    axes: 'box', gutter: true, xlabel: 'steps', ylabel: 'probability / distance', title });
}
export function drawSeries(s, values, color, options = {}) {
  s.path(values.map((x, t) => [t, x]), { color, width: 2, ...options });
}
