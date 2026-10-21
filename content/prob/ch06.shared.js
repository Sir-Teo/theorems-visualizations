// Finite models for Durrett5e Chapter6. Seeded traces illustrate, never prove, limits.
// Avoid adding the period to an already nonnegative remainder: that erases tiny phases.
export const mod = (x, n) => { const r = x % n; return r < 0 ? r + n : r === 0 ? 0 : r; };
export function random(seed) {
  let state = seed >>> 0;
  const word = () => (state = (Math.imul(1664525, state) + 1013904223) >>> 0);
  return () => ((word() >>> 5) * 67108864 + (word() >>> 6)) / 9007199254740992;
}
export function normal(rng) {
  return Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
}
export function stationaryTrace(kind, n, seed, parameter = .75) {
  const rng = random(seed), out = [];
  if (kind === 'ar') {
    let x = normal(rng);
    for (let k = 0; k < n; k++) { out.push(x); x = parameter * x + Math.sqrt(1 - parameter ** 2) * normal(rng); }
  } else if (kind === 'markov') {
    let x = +(rng() < .4);
    for (let k = 0; k < n; k++) { out.push(x); x = +(rng() < (x ? .7 : .2)); }
  } else {
    const component = rng() < .5 ? -1 : 1;
    for (let k = 0; k < n; k++) out.push(component + .25 * normal(rng));
  }
  return out;
}
export function rotationOrbit(alpha, start, n, bins = 16, period = 0) {
  let x = mod(start, 1); const cycle = period ? Array.from({length:period},(_,j)=>mod(start+j*alpha,1)) : null; const orbit = [], counts = Array(bins).fill(0), errors = [];
  for (let k = 0; k < n; k++) {
    if (cycle) x=cycle[k%period];
    orbit.push(x); counts[Math.min(bins - 1, Math.floor(bins * x))]++;
    errors.push(Math.max(...counts.map(c => Math.abs(c / (k + 1) - 1 / bins))));
    x = mod(x + alpha, 1);
  }
  return { orbit, counts, errors };
}
export function permutationComponents(n, step) {
  const visited = new Set(), components = [];
  for (let x = 0; x < n; x++) if (!visited.has(x)) {
    const orbit = []; let y = x;
    do { visited.add(y); orbit.push(y); y = mod(y + step, n); } while (y !== x);
    components.push(orbit);
  }
  return components;
}
export function birkhoffFinite(values, step, start, n) {
  const N = values.length, component = permutationComponents(N, step).find(a => a.includes(start));
  const limit = component.reduce((s, j) => s + values[j], 0) / component.length;
  const averages = []; let total = 0;
  for (let k = 0; k < n; k++) { total += values[mod(start + step * k, N)]; averages.push(total / (k + 1)); }
  return { averages, limit, component };
}
export function maximalErgodicFinite(values, step, horizon) {
  const n = values.length;
  const maxima = values.map((_, x) => {
    let s = 0, best = 0;
    for (let k = 0; k < horizon; k++) { s += values[mod(x + step * k, n)]; best = Math.max(best, s); }
    return best;
  });
  const selected = maxima.map(x => x > 0);
  const integral = values.reduce((s, x, i) => s + (selected[i] ? x : 0), 0) / n;
  return { maxima, selected, integral };
}
export function benfordPowers(n, base = 2) {
  let value = 1n; const multiplier = BigInt(base), counts = Array(9).fill(0), digits = [];
  for (let k = 1; k <= n; k++) {
    value *= multiplier; const digit = Number(value.toString()[0]); counts[digit - 1]++; digits.push(digit);
  }
  return { digits, counts, expected: counts.map((_, j) => Math.log10((j + 2) / (j + 1))) };
}
export function walkRange(n, seed, p = .5, kind = 'iid') {
  const rng = random(seed), initialBit = +(rng() < .5), drift = rng() < .5 ? -1 : 1;
  let position = 0, oldBit = initialBit; const path = [0], range = [0], visits = [], ratios = [0], seen = new Set();
  for (let k = 1; k <= n; k++) {
    let increment;
    if (kind === 'mixture') increment = drift;
    else if (kind === 'coboundary') { const bit = +(rng() < .5); increment = bit - oldBit; oldBit = bit; }
    else increment = rng() < p ? 1 : -1;
    position += increment; path.push(position); seen.add(position); range.push(seen.size); ratios.push(seen.size / k);
    if (position === 0) visits.push(k);
  }
  return { path, range, ratios, visits, componentMean: kind === 'mixture' ? drift : kind === 'coboundary' ? 0 : 2 * p - 1 };
}
export function finiteReturns(n, step, mask) {
  const selected = Array.from({ length: n }, (_, j) => j).filter(j => mask & (1 << j));
  if (!selected.length) return { selected, returns: [], mean: null, mass: 0, saturation: 0 };
  const components = permutationComponents(n, step), saturation = components.filter(c => c.some(j => selected.includes(j))).reduce((s, c) => s + c.length, 0) / n;
  const returns = selected.map(x => {
    for (let t = 1; t <= n; t++) if (selected.includes(mod(x + step * t, n))) return t;
    throw new Error('a finite permutation must return');
  });
  return { selected, returns, mean: returns.reduce((s, x) => s + x, 0) / selected.length, mass: selected.length / n, saturation };
}
export function lcs(a, b) {
  const rows = [Array(b.length + 1).fill(0)];
  for (let i = 1; i <= a.length; i++) {
    const row = [0], previous = rows[i - 1];
    for (let j = 1; j <= b.length; j++) row[j] = a[i - 1] === b[j - 1] ? previous[j - 1] + 1 : Math.max(previous[j], row[j - 1]);
    rows.push(row);
  }
  let i = a.length, j = b.length; const matches = [];
  while (i && j) {
    if (a[i - 1] === b[j - 1]) { matches.push([i - 1, j - 1]); i--; j--; }
    else if (rows[i - 1][j] >= rows[i][j - 1]) i--; else j--;
  }
  return { length: rows[a.length][b.length], rows, matches: matches.reverse() };
}
export function randomLetters(n, alphabet, seed) {
  const rng = random(seed); return Array.from({ length: n }, () => Math.floor(alphabet * rng()));
}
export function increasingSubsequence(values) {
  const tails = [], indices = [], before = Array(values.length).fill(-1);
  for (let i = 0; i < values.length; i++) {
    let lo = 0, hi = tails.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (tails[mid] < values[i]) lo = mid + 1; else hi = mid; }
    if (lo) before[i] = indices[lo - 1]; tails[lo] = values[i]; indices[lo] = i;
  }
  const path = []; let i = indices.at(-1);
  while (i !== undefined && i >= 0) { path.push(i); i = before[i]; }
  return { length: tails.length, indices: path.reverse() };
}
export function randomPermutation(n, seed) {
  const rng = random(seed), a = Array.from({ length: n }, (_, i) => i);
  for (let j = n - 1; j > 0; j--) { const k = Math.floor((j + 1) * rng()); [a[k], a[j]] = [a[j], a[k]]; }
  return a;
}
export function poissonArrivalScale(n, seed) {
  const rng = random(seed), area = [], times = [], ratios = []; let total = 0;
  for (let k = 1; k <= n; k++) { total -= Math.log(1 - rng()); area.push(total); times.push(Math.sqrt(total)); ratios.push(Math.sqrt(total / k)); }
  return { area, times, ratios };
}
export function positiveMatrixProduct(n, seed, p = .5) {
  const rng = random(seed), matrices = [[[2, 1], [1, 1]], [[1, 1], [1, 2]]];
  let A = [[1, 0], [0, 1]], logScale = 0; const rates = [], logNorms = [0], choices = [];
  for (let k = 1; k <= n; k++) {
    const choice = +(rng() >= p), B = matrices[choice]; choices.push(choice);
    const C = A.map(row => [row[0] * B[0][0] + row[1] * B[1][0], row[0] * B[0][1] + row[1] * B[1][1]]);
    const norm = Math.max(...C.map(row => row[0] + row[1])); logScale += Math.log(norm); A = C.map(row => row.map(x => x / norm));
    logNorms.push(logScale); rates.push(logScale / k);
  }
  return { rates, logNorms, normalized: A, choices, matrices };
}
export function passageGrid(width, height, seed) {
  const rng = random(seed), nodes = width * height, edges = [], adjacency = Array.from({ length: nodes }, () => []);
  const add = (a, b) => { const weight = .5 + rng(); edges.push({ a, b, weight }); adjacency[a].push([b, weight]); adjacency[b].push([a, weight]); };
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const a = y * width + x; if (x + 1 < width) add(a, a + 1); if (y + 1 < height) add(a, a + width);
  }
  const source = Math.floor(height / 2) * width, distances = Array(nodes).fill(Infinity), previous = Array(nodes).fill(-1), visited = new Set(); distances[source] = 0;
  for (let k = 0; k < nodes; k++) {
    let at = -1, best = Infinity;
    for (let j = 0; j < nodes; j++) if (!visited.has(j) && distances[j] < best) { best = distances[j]; at = j; }
    if (at < 0) break; visited.add(at);
    for (const [j, cost] of adjacency[at]) if (best + cost < distances[j]) { distances[j] = best + cost; previous[j] = at; }
  }
  const target = source + width - 1, path = []; let at = target;
  while (at >= 0) { path.push(at); at = previous[at]; }
  return { width, height, source, target, edges, distances, previous, path: path.reverse() };
}
