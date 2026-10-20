// Item-owned finite processes. Shared chapter algorithms are deliberately untouched.
export function attachmentRng(seed) {
  if (!Number.isInteger(seed)) throw new RangeError('An integer seed is required.');
  let state = seed >>> 0;
  const next = () => { state = (state + 0x6D2B79F5) >>> 0; let t = state; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return (t ^ t >>> 14) >>> 0; };
  return () => ((next() >>> 5) * 67108864 + (next() >>> 6)) / 9007199254740992;
}
function uniform(random) {
  const u = random(); if (!Number.isFinite(u) || u < 0 || u >= 1) throw new RangeError('Uniform draws must lie in [0,1).'); return u;
}
function mixtureParameters(m, p) {
  if (!Number.isInteger(m) || m < 1 || m > 6 || !Number.isFinite(p) || p < 0 || p > 1) throw new RangeError('Use integer m=1…6 and p in [0,1].');
}
export function finiteAttachmentShift(n, m, p) {
  mixtureParameters(m, p); if (!Number.isInteger(n) || n < m + 1) throw new RangeError('The old graph must contain its clique seed.');
  const degreeSum = 2 * m * n - m * (m + 1);
  return { degreeSum, a: p < 1 ? p * degreeSum / ((1 - p) * n) : null };
}
export function growAttachmentMixture(n, m, p, random) {
  mixtureParameters(m, p); if (!Number.isInteger(n) || n < m + 1 || n > 100000 || typeof random !== 'function') throw new RangeError('A supported size and uniform stream are required.');
  const degrees = new Int32Array(n), ends = new Int32Array(2 * m * n); let length = 0, repeated = 0;
  for (let i = 1; i <= m; i++) for (let j = 0; j < i; j++) { degrees[i]++; degrees[j]++; ends[length++] = i; ends[length++] = j; }
  const chosen = new Int32Array(m);
  for (let v = m + 1; v < n; v++) {
    const oldLength = length;
    for (let j = 0; j < m; j++) {
      const coin = uniform(random), u = uniform(random);
      chosen[j] = coin < p ? Math.floor(u * v) : ends[Math.floor(u * oldLength)];
      for (let k = 0; k < j; k++) if (chosen[j] === chosen[k]) { repeated++; break; }
    }
    // All choices use the frozen pre-arrival graph; repeated endpoints are retained.
    for (const target of chosen) { degrees[target]++; degrees[v]++; ends[length++] = target; ends[length++] = v; }
  }
  return { degrees, n, m, p, edges: length / 2, repeated, ends: ends.slice(0, length) };
}
export function growNonlinearTree(n, gamma, random) {
  if (!Number.isInteger(n) || n < 2 || n > 100000 || !Number.isFinite(gamma) || gamma < 0 || gamma > 2 || typeof random !== 'function') throw new RangeError('Use a supported tree size, kernel exponent and uniform stream.');
  const degrees = new Int32Array(n), parents = new Int32Array(n), tree = new Float64Array(n + 1);
  const add = (i, d) => { for (i++; i <= n; i += i & -i) tree[i] += d; };
  const weight = k => k ** gamma;
  degrees[0] = degrees[1] = 1; parents[0] = -1; parents[1] = 0; add(0, 1); add(1, 1);
  for (let v = 2; v < n; v++) {
    let total = 0; for (let i = v; i > 0; i -= i & -i) total += tree[i];
    let x = uniform(random) * total, pos = 0, jump = 1;
    while (jump * 2 <= n) jump *= 2;
    // Search only the v populated categories; the final one owns the residual
    // interval, including a floating-point-rounded upper boundary.
    for (; jump; jump >>= 1) if (pos + jump < v && tree[pos + jump] <= x) { x -= tree[pos + jump]; pos += jump; }
    if (pos >= v) throw new Error('A positive-weight earlier target is required.');
    add(pos, weight(degrees[pos] + 1) - weight(degrees[pos])); degrees[pos]++;
    degrees[v] = 1; parents[v] = pos; add(v, 1);
  }
  return { degrees, parents, n, gamma, edges: n - 1 };
}
export function attachmentCounts(degrees) {
  const counts = new Map(); for (const k of degrees) counts.set(k, (counts.get(k) || 0) + 1);
  return [...counts].sort((a, b) => a[0] - b[0]);
}
export function attachmentSurvival(degrees) {
  let count = degrees.length;
  return attachmentCounts(degrees).map(([k, n]) => { const point = [k, count / degrees.length]; count -= n; return point; });
}
export function attachmentRateLaw(m, a, kmax) {
  mixtureParameters(m, 0);
  if (!Number.isFinite(a) || a <= -m || !Number.isInteger(kmax) || kmax < m) throw new RangeError('Use a>-m and an integer degree range.');
  const beta = m / (2 * m + a), P = new Float64Array(kmax + 1); P[m] = 1 / (1 + beta * (m + a));
  for (let k = m + 1; k <= kmax; k++) P[k] = P[k - 1] * beta * (k - 1 + a) / (1 + beta * (k + a));
  return { m, a, beta, gamma: 1 + 1 / beta, P, tail: beta * (kmax + a) * P[kmax] };
}
export function attachmentStationary(m, p, kmax) {
  mixtureParameters(m, p);
  if (p < 1) return { p, ...attachmentRateLaw(m, 2 * m * p / (1 - p), kmax) };
  if (!Number.isInteger(kmax) || kmax < m) throw new RangeError('A displayed integer degree range is required.');
  const P = new Float64Array(kmax + 1); P[m] = 1 / (m + 1);
  for (let k = m + 1; k <= kmax; k++) P[k] = P[k - 1] * m / (m + 1);
  return { m, p, a: null, beta: null, gamma: null, P, tail: (m / (m + 1)) ** (kmax - m + 1) };
}
export function approximateAttachmentTail(degrees, kmin) {
  if (!Number.isInteger(kmin) || kmin < 2) throw new RangeError('Use an integer tail threshold >=2.');
  let n = 0, sum = 0;
  for (const k of degrees) if (k >= kmin) { n++; sum += Math.log(k / (kmin - .5)); }
  const estimate = n ? 1 + n / sum : null;
  return { kmin, n, estimate, sufficient: n >= 50 };
}
export function attachmentLogView(lo, hi) {
  if (!(lo > 0 && hi >= lo && Number.isFinite(hi))) throw new RangeError('Positive finite log bounds are required.');
  const padding = Math.max(.35, .12 * Math.log(hi / lo)); return [lo * Math.exp(-padding), hi * Math.exp(padding)];
}
