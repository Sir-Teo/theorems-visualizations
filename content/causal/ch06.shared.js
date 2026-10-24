// Synthetic causal models. Population identification and sampling are kept separate.
import * as LP from '../opt/ch06.shared.js';

export const sources = {
  book: 'https://miguelhernan.org/s/hernanrobins_WhatIf_19aug26.pdf',
  bounds: 'https://ftp.cs.ucla.edu/pub/stat_ser/r199-jasa.pdf',
  did: 'https://psantanna.com/files/RSBP_DiD_Review.pdf',
};
export const sum = a => a.reduce((s, x) => s + x, 0);
export const mean = a => a.length ? sum(a) / a.length : null;
export const dot = (a, b) => sum(a.map((x, i) => x * b[i]));
export function moments(a) {
  if (!a.length) return { n: 0, mean: null, variance: null, se: null };
  const m = mean(a), variance = a.length > 1 ? sum(a.map(x => (x - m) ** 2)) / (a.length - 1) : null;
  return { n: a.length, mean: m, variance, se: variance === null ? null : Math.sqrt(variance / a.length) };
}
export function quantile(a, p) {
  if (!a.length) return null;
  const b = a.slice().sort((x, y) => x - y), t = p * (b.length - 1), i = Math.floor(t);
  return b[i] + (t - i) * (b[Math.min(i + 1, b.length - 1)] - b[i]);
}
export function histogram(values, lo, hi, bins = 28) {
  const counts = Array(bins).fill(0), width = (hi - lo) / bins;
  let left = 0, right = 0, unavailable = 0;
  for (const x of values) {
    if (!Number.isFinite(x)) unavailable++;
    else if (x < lo) left++;
    else if (x > hi) right++;
    else counts[Math.min(bins - 1, Math.floor((x - lo) / width))]++;
  }
  return { counts, density: counts.map(n => n / (values.length * width || 1)), lo, hi, width, left, right, unavailable };
}
export function noise(M, shape, rng) {
  const d = shape === 'skewed' ? M.dist.lognormal(0, .7) : shape === 'heavy tails' ? M.dist.studentT(3) : M.dist.normal(0, 1);
  const center = d.mean, scale = Math.sqrt(d.variance);
  return () => (d.sample(rng) - center) / scale;
}

// Enumerate a four-node binary DAG with U -> A,Y, and optional U -> Z / Z -> Y.
export function instrumentPopulation({ strength = .35, direct = 0, association = 0 } = {}) {
  const cells = [];
  for (const u of [0, 1]) for (const z of [0, 1]) for (const a of [0, 1]) for (const y of [0, 1]) {
    const pz = .5 + association * (u - .5), pa = .15 + strength * z + .2 * u;
    const py = .1 + .25 * a + .25 * u + direct * z;
    cells.push({ u, z, a, y, p: .5 * (z ? pz : 1 - pz) * (a ? pa : 1 - pa) * (y ? py : 1 - py) });
  }
  const conditional = (key, z) => sum(cells.filter(c => c.z === z).map(c => c.p * c[key])) / sum(cells.filter(c => c.z === z).map(c => c.p));
  const first = conditional('a', 1) - conditional('a', 0), reduced = conditional('y', 1) - conditional('y', 0);
  return { cells, first, reduced, ratio: first === 0 ? null : reduced / first, ate: .25, means: [0, 1].map(z => [conditional('a', z), conditional('y', z)]) };
}

export function regression(x, y) {
  const mx = mean(x), my = mean(y), xx = sum(x.map(t => (t - mx) ** 2));
  if (!x.length || xx === 0) return null;
  const slope = sum(x.map((t, i) => (t - mx) * (y[i] - my))) / xx;
  return { intercept: my - slope * mx, slope, xx, predict: t => my + slope * (t - mx) };
}
export function linearPopulation({ strength = .8, tau = .7, confounding = 1, direct = 0 } = {}) {
  const varianceA = strength ** 2 / 4 + confounding ** 2 + 1;
  return { first: strength, reduced: tau * strength + direct, wald: strength === 0 ? null : tau + direct / strength,
    ols: tau + (confounding + direct * strength / 4) / varianceA, tau };
}
export function linearSample(M, rng, { n = 80, strength = .8, tau = .7, confounding = 1, direct = 0, shape = 'normal' } = {}) {
  const draw = noise(M, shape, rng);
  return Array.from({ length: n }, (_, i) => {
    const z = +(i >= n / 2), u = draw(), a = strength * z + confounding * u + draw();
    return { z, a, y: tau * a + u + direct * z + draw(), u };
  });
}
export function ivStatistics(data) {
  const arms = [0, 1].map(z => data.filter(r => r.z === z));
  if (arms.some(a => a.length < 2)) return null;
  const n = data.length, ma = arms.map(a => mean(a.map(r => r.a))), my = arms.map(a => mean(a.map(r => r.y)));
  const da = ma[1] - ma[0], dy = my[1] - my[0], within = [0, 0, 0];
  for (const r of data) { const a = r.a - ma[r.z], y = r.y - my[r.z]; within[0] += a * a; within[1] += a * y; within[2] += y * y; }
  const [saa, say, syy] = within.map(x => x / (n - 2)), h = 1 / arms[0].length + 1 / arms[1].length;
  const slope = da === 0 ? null : dy / da;
  const firstSE = Math.sqrt(saa * h), firstF = firstSE === 0 ? (da === 0 ? null : Infinity) : (da / firstSE) ** 2;
  const se = slope === null ? null : Math.sqrt(Math.max(0, syy - 2 * slope * say + slope * slope * saa) * h) / Math.abs(da);
  const z = data.map(r => r.z), a = data.map(r => r.a), y = data.map(r => r.y), stage1 = regression(z, a);
  const stage2 = regression(data.map(r => stage1.predict(r.z)), y), ols = regression(a, y);
  return { n, ma, my, da, dy, saa, say, syy, h, slope, se, firstF, stage1, stage2, ols };
}
export function arCoefficients(s, critical) {
  const k = critical ** 2 * s.h;
  return [s.da ** 2 - k * s.saa, -2 * s.da * s.dy + 2 * k * s.say, s.dy ** 2 - k * s.syy];
}
export const polynomial = (q, x) => (q[0] * x + q[1]) * x + q[2];
// Closed sublevel set of a quadratic, retaining unbounded/disconnected possibilities.
export function quadraticSet([a, b, c]) {
  if (a === 0) {
    if (b === 0) return c <= 0 ? [[-Infinity, Infinity]] : [];
    return b > 0 ? [[-Infinity, -c / b]] : [[-c / b, Infinity]];
  }
  const d = b * b - 4 * a * c;
  if (d < 0) return a < 0 ? [[-Infinity, Infinity]] : [];
  if (d === 0) return a < 0 ? [[-Infinity, Infinity]] : [[-b / (2 * a), -b / (2 * a)]];
  const q = -.5 * (b + (b >= 0 ? 1 : -1) * Math.sqrt(d)), roots = [q / a, c / q].sort((x, y) => x - y);
  return a > 0 ? [roots] : [[-Infinity, roots[0]], [roots[1], Infinity]];
}
export function ivExperiment(M, options = {}) {
  const { reps = 100, seed = 1, n = 80, tau = .7 } = options, rng = M.rng(seed), critical = M.dist.studentT(n - 2).quantile(.975);
  const estimates = [], ols = [], firstF = [], arCover = [], waldCover = []; let first;
  for (let i = 0; i < reps; i++) {
    const data = linearSample(M, rng, options), s = ivStatistics(data), q = arCoefficients(s, critical);
    if (!i) first = { data, stats: s, q, set: quadraticSet(q), critical };
    estimates.push(s.slope); ols.push(s.ols.slope); firstF.push(s.firstF);
    arCover.push(+(polynomial(q, tau) <= 0));
    waldCover.push(+(s.slope !== null && Math.abs(s.slope - tau) <= 1.959963984540054 * s.se));
  }
  return { first, estimates, ols, firstF, ar: moments(arCover), wald: moments(waldCover), population: linearPopulation(options) };
}

export const strata = [ { name: 'never', a0: 0, a1: 0 }, { name: 'complier', a0: 0, a1: 1 }, { name: 'defier', a0: 1, a1: 0 }, { name: 'always', a0: 1, a1: 1 } ];
export function principal(weights = [3, 10, 0, 3], effects = [.2, .8, -.4, .1]) {
  const total = sum(weights); if (!total) return null;
  const p = weights.map(x => x / total), first = p[1] - p[2], reduced = p[1] * effects[1] - p[2] * effects[2];
  const cells = [0, 1].map(z => [0, 1].map(a => p.map((w, j) => strata[j]['a' + z] === a ? w : 0)));
  return { p, first, reduced, ratio: first === 0 ? null : reduced / first, ate: dot(p, effects), complier: p[1] ? effects[1] : null, cells };
}
export function manski(counts = [6, 2, 3, 9], completion = .5, monotone = false) {
  const total = sum(counts); if (!total) return null;
  const p = counts.map(x => x / total), low = monotone ? 0 : -p[1] - p[2], high = p[0] + p[3], cells = [];
  for (let a = 0; a <= 1; a++) for (let y = 0; y <= 1; y++) {
    const unknown = monotone ? (a ? (y ? 1 - completion : 0) : (y ? 1 : completion)) : (a ? 1 - completion : completion);
    for (let v = 0; v <= 1; v++) cells.push({ a, y0: a ? v : y, y1: a ? y : v, p: p[2 * a + y] * (v ? unknown : 1 - unknown) });
  }
  return { p, low, high, cells, ate: sum(cells.map(c => c.p * (c.y1 - c.y0))) };
}

export const responseTypes = Array.from({ length: 16 }, (_, j) => ({ a0: (j >> 3) & 1, a1: (j >> 2) & 1, y0: (j >> 1) & 1, y1: j & 1 }));
export const responseMatrix = Array.from({ length: 8 }, (_, i) => responseTypes.map(t => +(t['a' + (i >> 2)] === ((i >> 1) & 1) && t['y' + ((i >> 1) & 1)] === (i & 1))));
export function responseTable(weights) {
  const counts = responseMatrix.map(row => dot(row, weights));
  return [counts.slice(0, 4), counts.slice(4)];
}
export const tablePresets = {
  mixed: responseTable([3, 1, 0, 2, 1, 6, 1, 2, 0, 1, 1, 0, 2, 1, 0, 3]),
  perfect: [[12, 0, 0, 0], [0, 0, 0, 12]],
  incompatible: [[12, 0, 0, 0], [0, 12, 0, 0]],
};
export function instrumentalInequality(counts) {
  if (counts.some(row => sum(row) === 0)) return null;
  const p = counts.map(row => row.map(x => x / sum(row))), terms = [0, 1].map(a => [0, 1].map(y => Math.max(p[0][2 * a + y], p[1][2 * a + y])));
  return { p, terms, sums: terms.map(sum), maximum: Math.max(...terms.map(sum)) };
}
export function balkePearl(counts, monotone = false, percent = 50) {
  if (counts.some(row => sum(row) === 0)) return { status: 'undefined conditional row' };
  const b = counts.flatMap(row => row.map(c => LP.R(c, sum(row))));
  const keep = responseTypes.map((t, j) => ({ t, j })).filter(({ t }) => !monotone || t.a0 <= t.a1).map(({ j }) => j);
  const A = responseMatrix.map(row => keep.map(j => row[j]));
  const solve = sign => {
    const lp = LP.standard(A, b, keep.map(j => sign * (responseTypes[j].y1 - responseTypes[j].y0)));
    const phase = LP.phaseOne(lp);
    if (phase.status !== 'feasible') return { status: phase.status, certificate: phase.certificate?.map(LP.str) };
    const run = LP.primal(lp, phase.cleaned, 'Bland');
    if (run.status !== 'optimal') return { status: run.status };
    const end = run.history.at(-1), value = LP.mul(sign, end.value), witness = Array.from({ length: 16 }, () => LP.R(0));
    keep.forEach((j, i) => witness[j] = end.x[i]);
    const exact = responseMatrix.every((row, i) => LP.cmp(LP.dot(row, witness), b[i]) === 0) && witness.every(x => LP.cmp(x, 0) >= 0);
    if (!exact) throw new Error('Response-type certificate failed');
    return { status: 'optimal', value, witness, pivots: phase.history.length + run.history.length - 2 };
  };
  const lower = solve(1); if (lower.status !== 'optimal') return lower;
  const upper = solve(-1); if (upper.status !== 'optimal') return upper;
  const t = LP.R(percent, 100), witness = lower.witness.map((x, j) => LP.add(LP.mul(LP.sub(1, t), x), LP.mul(t, upper.witness[j])));
  const effect = LP.dot(witness, responseTypes.map(t => t.y1 - t.y0));
  return { status: 'optimal', low: LP.num(lower.value), high: LP.num(upper.value), lowExact: LP.str(lower.value), highExact: LP.str(upper.value),
    weights: witness.map(LP.num), weightsExact: witness.map(LP.str), effect: LP.num(effect), effectExact: LP.str(effect), pivots: lower.pivots + upper.pivots };
}

export function didPopulation({ tau = .7, trend = 0, shock = 0, anticipation = 0, gap = 1 } = {}) {
  const times = [-2, -1, 0, 1], control = times.map(t => .4 * t), untreated = times.map(t => gap + (.4 + trend) * t + (t === 1 ? shock : 0));
  const treated = untreated.map((y, i) => y + (times[i] === 1 ? tau : times[i] === 0 ? anticipation : 0));
  return { times, control, untreated, treated, did: tau + trend + shock - anticipation, tau, bias: trend + shock - anticipation };
}
export function didExperiment(M, options = {}) {
  const { n = 40, reps = 100, seed = 1, shape = 'normal', sigma = 1 } = options, population = didPopulation(options), draw = noise(M, shape, M.rng(seed));
  const estimates = []; let first;
  for (let b = 0; b < reps; b++) {
    const groups = [0, 1].map(g => Array.from({ length: n }, () => { const alpha = draw(); return population.times.map((_, j) => (g ? population.treated[j] : population.control[j]) + alpha + sigma * draw()); }));
    const averages = groups.map(units => population.times.map((_, j) => mean(units.map(u => u[j]))));
    estimates.push(averages[1][3] - averages[1][2] - averages[0][3] + averages[0][2]);
    if (!b) first = { groups, averages };
  }
  return { population, first, estimates, measured: moments(estimates), expected: population.did, sd: 2 * sigma / Math.sqrt(n) };
}

export function rdDesign({ n = 80, density = 'balanced' } = {}) {
  const right = Math.round(n * (density === 'more above' ? .8 : .5)), left = n - right;
  return [...Array.from({ length: left }, (_, i) => -(i + .5) / left), ...Array.from({ length: right }, (_, i) => (i + .5) / right)].sort((a, b) => a - b);
}
export function localLinearWeights(xs, bandwidth, side) {
  const w = xs.map(x => (side ? x >= 0 : x < 0) ? Math.max(0, 1 - Math.abs(x) / bandwidth) : 0);
  const s0 = sum(w), s1 = dot(w, xs), s2 = dot(w, xs.map(x => x * x)), det = s0 * s2 - s1 * s1;
  if (w.filter(x => x > 0).length < 2 || det <= 0) return null;
  return { intercept: w.map((v, i) => v * (s2 - s1 * xs[i]) / det), slope: w.map((v, i) => v * (s0 * xs[i] - s1) / det), count: w.filter(x => x > 0).length };
}
export function rdExperiment(M, options = {}) {
  const { n = 80, density = 'balanced', bandwidth = .5, tau = .7, curvature = 1, jump = 0, sigma = .5, shape = 'normal', reps = 100, seed = 1 } = options;
  const xs = rdDesign({ n, density }), means = xs.map(x => .5 * x + (x >= 0 ? tau + jump + curvature * x * x : 0));
  const fits = [0, 1].map(side => localLinearWeights(xs, bandwidth, side));
  if (fits.some(f => !f)) return { status: 'insufficient local rank', xs, means, fits };
  const weights = fits[0].intercept.map((x, i) => fits[1].intercept[i] - x), expected = dot(weights, means), sd = sigma * Math.hypot(...weights);
  const draw = noise(M, shape, M.rng(seed)), estimates = []; let first;
  for (let b = 0; b < reps; b++) { const ys = means.map(y => y + sigma * draw()); estimates.push(dot(weights, ys)); if (!b) first = { ys, fits: fits.map(f => ({ intercept: dot(f.intercept, ys), slope: dot(f.slope, ys) })) }; }
  return { status: 'fit', xs, means, fits, weights, expected, sd, observedLimit: tau + jump, tau, estimates, measured: moments(estimates), first };
}

export const geneticFrequencies = [.2, .25, .3, .35, .4];
export function mrPopulation({ strength = 1, pleiotropy = 0, variant = 2, structure = false, tau = .7 } = {}) {
  const gamma = [.2, .3, .4, .5, .6].map(x => strength * x), alpha = gamma.map((_, j) => j === variant ? pleiotropy : 0);
  const d = gamma.map((_, j) => structure ? .04 + .01 * j : 0), kappa = structure ? 1 : 0;
  const covariance = gamma.map((_, j) => gamma.map((_, k) => j === k ? 2 * geneticFrequencies[j] * (1 - geneticFrequencies[j]) + 2 * d[j] ** 2 : 4 * d[j] * d[k]));
  const bx = gamma.map((_, j) => (dot(covariance[j], gamma) + 2 * kappa * d[j]) / covariance[j][j]);
  const by = bx.map((x, j) => tau * x + (dot(covariance[j], alpha) + 2 * kappa * d[j]) / covariance[j][j]);
  return { gamma, alpha, d, kappa, covariance, bx, by, ratios: bx.map((x, j) => x === 0 ? null : by[j] / x), tau };
}
export function mrExperiment(M, options = {}) {
  const { n = 200, reps = 100, seed = 1, variant = 2, shape = 'normal' } = options, population = mrPopulation(options), rng = M.rng(seed), draw = noise(M, shape, rng);
  const geneLaws = [-1, 1].map(ancestry => geneticFrequencies.map((p, j) => M.dist.binomial(2, p + population.d[j] * ancestry)));
  const estimates = []; let first;
  for (let b = 0; b < reps; b++) {
    const data = Array.from({ length: n }, () => {
      const ancestry = rng() < .5 ? -1 : 1;
      const genes = geneLaws[+(ancestry === 1)].map(law => law.sample(rng));
      const centered = genes.map((g, j) => g - 2 * geneticFrequencies[j]), u = population.kappa * ancestry + draw(), x = dot(population.gamma, centered) + u + draw();
      return { genes, x, y: population.tau * x + u + dot(population.alpha, centered) + draw() };
    });
    const bx = population.gamma.map((_, j) => regression(data.map(r => r.genes[j]), data.map(r => r.x))?.slope ?? null);
    const by = population.gamma.map((_, j) => regression(data.map(r => r.genes[j]), data.map(r => r.y))?.slope ?? null);
    const ratios = bx.map((x, j) => x === null || x === 0 || by[j] === null ? null : by[j] / x);
    estimates.push(ratios[variant]); if (!b) first = { data, bx, by, ratios };
  }
  return { population, first, estimates };
}
