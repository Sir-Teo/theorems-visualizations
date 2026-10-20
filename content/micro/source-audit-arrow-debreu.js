// Authored three-good production economy; not numerical data from Arrow–Debreu (1954).
export const AD_ALPHA = [[.5, .3, .2], [.2, .5, .3], [.3, .2, .5]];
export const AD_OMEGA = [[3, .5, 1], [.5, 2.5, 1], [1, .5, 3]];
export const AD_SHARES = [.5, .2, .3];
export const AD_TOTAL = [4.5, 3.5, 5];
const positivePrices = p => { if (p.length !== 3 || !p.every(x => Number.isFinite(x) && x > 0)) throw new RangeError('Three strictly positive prices are required.'); };
const normalize = p => { const sum = p.reduce((a, b) => a + b); return p.map(x => x / sum); };
export function adFirm(k, kind, p) {
  positivePrices(p);
  const capacity = kind === 'cvx' ? 1000 : 3, exponent = kind === 'cvx' ? .5 : 1.6;
  const capacityOutput = k * capacity ** exponent, gain = p[1] * capacityOutput - p[0] * capacity;
  // The equality comparison only accommodates roundoff in a constructed tie price.
  const tie = kind === 'inc' && Math.abs(gain) <= 16 * Number.EPSILON * Math.max(p[1] * capacityOutput, p[0] * capacity);
  const L = kind === 'cvx' ? Math.min(capacity, (k * p[1] / (2 * p[0])) ** 2) : gain > 0 && !tie ? capacity : 0;
  const output = k * L ** exponent, profit = p[1] * output - p[0] * L;
  return { L, output, profit, capacity, exponent, tie, capacityGain: gain, maximizers: tie ? [0, 3] : [L] };
}
export function adMarket(k, kind, p, chosenL) {
  const firm = adFirm(k, kind, p), L = chosenL ?? firm.L, output = k * L ** firm.exponent;
  const profit = p[1] * output - p[0] * L;
  const incomes = AD_OMEGA.map((w, i) => w.reduce((s, x, g) => s + x * p[g], 0) + AD_SHARES[i] * profit);
  const demands = AD_ALPHA.map((a, i) => a.map((x, g) => x * incomes[i] / p[g]));
  const net = [-L, output, 0], z = AD_TOTAL.map((x, g) => demands.reduce((s, d) => s + d[g], 0) - x - net[g]);
  return { p: [...p], L, output, profit, incomes, demands, net, z, firm,
    profitMaximizing: firm.maximizers.some(q => Math.abs(q - L) < 1e-10), value: z.reduce((s, x, g) => s + x * p[g], 0) };
}
export function adConditionalClearing(k, kind, L) {
  const output = k * L ** (kind === 'cvx' ? .5 : 1.6), r = (1115 + 409 * output) / (1450 - 341 * L);
  const t = ((1.25 - .31 * L) * r + 1.1 + .31 * output) / 3;
  return { r, t, ...adMarket(k, kind, normalize([r, 1, t]), L) };
}
export function adConvexEquilibrium(k) {
  // u=sqrt(L). Positive solution of 1159 k u²+2230 u−1450 k=0; rationalized to avoid cancellation.
  const u = 2900 * k / (2230 + Math.sqrt(2230 ** 2 + 4 * 1159 * 1450 * k * k));
  return { u, ...adConditionalClearing(k, 'cvx', u * u) };
}
export function adNonconvexCertificate(k) {
  const output = k * 3 ** 1.6, r = output / 3;
  const tiePrice = normalize([r, 1, (1.25 * r + 1.1) / 3]);
  const branches = [0, 3].map(L => {
    const s = adConditionalClearing(k, 'inc', L);
    return { ...s, capacityGain: s.p[1] * output - 3 * s.p[0] };
  });
  return { output, branches, tiePrice, tieStates: [0, 3].map(L => adMarket(k, 'inc', tiePrice, L)) };
}
export function adPriceMap(p, z, lambda) {
  positivePrices(p);
  if (!z.every(Number.isFinite) || !(lambda > 0)) throw new RangeError('Finite excess demand and a positive step are required.');
  const positive = z.map(x => Math.max(0, x)), denominator = 1 + lambda * positive.reduce((a, b) => a + b);
  return p.map((x, g) => (x + lambda * positive[g]) / denominator);
}
export function adProjectStart(p, epsilon = .02) {
  // Euclidean projection onto {q: sum q=1, q_i>=epsilon}; already feasible prices remain fixed.
  const sorted = p.map(x => x - epsilon).sort((a, b) => b - a), mass = 1 - 3 * epsilon;
  let sum = 0, threshold = 0;
  for (let i = 0; i < 3; i++) { sum += sorted[i]; const q = (sum - mass) / (i + 1); if (sorted[i] > q) threshold = q; }
  const result = p.map(x => Math.max(epsilon, x - threshold));
  const largest = result.indexOf(Math.max(...result)); result[largest] += 1 - result.reduce((a, b) => a + b);
  return result;
}
export function adTrajectory(k, kind, start, lambda, count = 40) {
  const path = [[...start]], displacements = [], markets = [];
  for (let i = 0; i <= count; i++) {
    const p = path[i], market = adMarket(k, kind, p), next = adPriceMap(p, market.z, lambda);
    markets.push(market); displacements.push(Math.hypot(...next.map((x, g) => x - p[g])));
    if (i < count) path.push(next);
  }
  return { path, displacements, markets };
}
