// Small, exhaustive models for the foundations chapter. No cryptographic security claims.
export const sum = a => a.reduce((x, y) => x + y, 0);
export function integer(x, lo, hi, label = 'value') {
  if (!Number.isInteger(x) || x < lo || x > hi) throw new Error(`${label} must be an integer from ${lo} to ${hi}.`);
  return x;
}
export function numbers(value, count, lo, hi, label = 'table') {
  let a;
  try { a = typeof value === 'string' && value.trim().startsWith('[') ? JSON.parse(value) : typeof value === 'string' ? value.trim().split(/[\s,]+/).map(Number) : value; }
  catch { throw new Error(`${label} must contain ${count} integers.`); }
  if (!Array.isArray(a) || a.length !== count) throw new Error(`${label} must contain ${count} integers.`);
  return Array.from(a, x => integer(x, lo, hi, label));
}
export const parity = x => { let p = 0; for (; x; x >>>= 1) p ^= x & 1; return p; };
export const bits = (x, n) => x.toString(2).padStart(n, '0');
export const dot = (x, y) => parity(x & y);
export const entropy = p => -sum(p.filter(x => x > 0).map(x => x * Math.log2(x)));
export function functionTable(value, n = 3) {
  integer(n, 1, 4, 'input bits');
  return numbers(value, 2 ** n, 0, 2 ** n - 1, 'function table');
}
export function fibers(table) {
  const N = table.length, out = Array.from({ length: N }, () => []);
  table.forEach((y, x) => out[y].push(x));
  return out;
}
export function inversion(table, sampled, budget) {
  const n = Math.log2(table.length), f = functionTable(table, n), N = f.length;
  integer(sampled, 0, N - 1, 'sampled input'); integer(budget, 0, N, 'search budget');
  const y = f[sampled], groups = fibers(f), trace = [];
  for (let x = 0; x < budget; x++) { trace.push({ x, y: f[x], match: f[x] === y }); if (f[x] === y) break; }
  const candidate = trace.at(-1)?.match ? trace.at(-1).x : null;
  const success = f.filter(z => groups[z][0] < budget).length / N;
  return { f, y, groups, trace, candidate, success, recoveredOriginal: candidate === sampled, preimages: groups[y] };
}
export function prefixInversion(table, y) {
  const n = Math.log2(table.length), f = functionTable(table, n), N = f.length;
  integer(y, 0, N - 1, 'target output');
  const matches = f.flatMap((z, x) => z === y ? [x] : []);
  const trace = [{ prefix: '', question: 'Does any preimage exist?', yes: matches.length > 0, remaining: matches }];
  if (!matches.length) return { trace, candidate: null, calls: 1, verified: false };
  let prefix = '', remaining = matches;
  for (let j = 0; j < n; j++) {
    const question = prefix + '0', yes = remaining.some(x => bits(x, n).startsWith(question));
    prefix += yes ? '0' : '1'; remaining = matches.filter(x => bits(x, n).startsWith(prefix));
    trace.push({ prefix, question, yes, remaining });
  }
  const candidate = parseInt(prefix, 2);
  return { trace, candidate, calls: n + 1, verified: f[candidate] === y };
}
export function predicateExperiment(table, predicate, predictor) {
  const n = Math.log2(table.length), f = functionTable(table, n), N = f.length;
  const b = numbers(predicate, N, 0, 1, 'predicate'), p = numbers(predictor, N, 0, 1, 'predictor');
  const groups = fibers(f), correct = f.map((y, x) => p[y] === b[x]);
  const counts = groups.map(g => [g.filter(x => b[x] === 0).length, g.filter(x => b[x] === 1).length]);
  const optimal = counts.map(([a, c]) => c > a ? 1 : 0);
  return { f, b, p, correct, counts, optimal, success: correct.filter(Boolean).length / N, bestSuccess: sum(counts.map(a => Math.max(...a))) / N };
}
export function seededWords(seed, count, N) {
  integer(seed, 0, 65535, 'seed');
  integer(count, 1, 6, 'number of shifts'); integer(Math.log2(N), 1, 4, 'word bits');
  let state = seed >>> 0;
  return Array.from({ length: count }, () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return Math.floor(state / 2 ** 32 * N); });
}
export function goldreichLevin(table, hidden, predictor, basis) {
  const n = Math.log2(table.length), f = functionTable(table, n), N = f.length;
  integer(hidden, 0, N - 1, 'hidden input');
  const p = numbers(predictor, N, 0, 1, 'Hadamard predictor');
  if (!Array.isArray(basis) || basis.length < 1 || basis.length > 6) throw new Error('Use one to six random basis shifts.');
  basis = numbers(basis, basis.length, 0, N - 1, 'basis shift');
  const k = basis.length, m = 2 ** k - 1;
  const shifts = Array.from({ length: m }, (_, j) => { const mask = j + 1; let r = 0; for (let t = 0; t < k; t++) if (mask & (1 << t)) r ^= basis[t]; return { mask, r }; });
  const replies = Array.from({ length: n }, (_, i) => shifts.map(({ r }) => p[r ^ (1 << i)]));
  const guesses = [];
  for (let guess = 0; guess < 2 ** k; guess++) {
    let candidate = 0;
    const votes = Array.from({ length: n }, (_, i) => sum(shifts.map(({ mask }, j) => replies[i][j] ^ dot(guess, mask))));
    votes.forEach((ones, i) => { if (2 * ones > m) candidate |= 1 << i; });
    guesses.push({ guess, votes, candidate, verifies: f[candidate] === f[hidden] });
  }
  const accuracy = sum(p.map((b, r) => +(b === dot(hidden, r)))) / N, epsilon = accuracy - .5;
  const candidates = [...new Set(guesses.map(g => g.candidate))], verified = candidates.filter(x => f[x] === f[hidden]);
  const trueGuess = sum(basis.map((r, i) => dot(hidden, r) * 2 ** i));
  return { n, N, k, m, p, shifts, guesses, trueGuess, candidates, verified, accuracy, epsilon,
    containsHidden: candidates.includes(hidden), queryCalls: n * m, voteOperations: 2 ** k * n * m,
    failureBound: epsilon > 0 ? Math.min(1, n / (4 * m * epsilon ** 2)) : 1 };
}
export function permutationGenerator(table, predicate, distinguisher) {
  const n = Math.log2(table.length), f = functionTable(table, n), N = f.length;
  if (new Set(f).size !== N) throw new Error('This construction requires a permutation: every output appears once.');
  const b = numbers(predicate, N, 0, 1, 'predicate'), d = numbers(distinguisher, 2 * N, 0, 1, 'distinguisher');
  const output = f.map((y, x) => 2 * y + b[x]);
  const real = sum(output.map(z => d[z])) / N, uniform = sum(d) / (2 * N), gap = real - uniform;
  const rawSuccess = sum(f.map((y, x) => (d[2 * y + b[x]] + 1 - d[2 * y + 1 - b[x]]) / 2)) / N;
  return { f, b, d, output, real, uniform, gap, rawSuccess, predictorSuccess: gap < 0 ? 1 - rawSuccess : rawSuccess, complemented: gap < 0 };
}
export function sequentialGenerator(table, seed, steps, test = 'range', threshold = 3) {
  const N = table.length, n = Math.log2(N); integer(n, 1, 4, 'seed bits');
  const g = numbers(table, N, 0, 2 * N - 1, 'one-bit generator');
  integer(seed, 0, N - 1, 'seed'); integer(steps, 1, 6, 'steps'); integer(threshold, 0, n + 6, 'weight threshold');
  if (!['range', 'parity', 'weight', 'endpoints'].includes(test)) throw new Error('Unknown output test.');
  const run = (s, remaining, prefix = 0) => {
    const trace = [];
    for (let i = 0; i < remaining; i++) { const output = g[s], bit = Math.floor(output / N), next = output % N; trace.push({ state: s, output, bit, next }); prefix = 2 * prefix + bit; s = next; }
    return { word: prefix * N + s, state: s, trace };
  };
  const size = N * 2 ** steps, hybrids = [];
  for (let j = 0; j <= steps; j++) {
    const counts = Array(size).fill(0), samples = N * 2 ** j;
    for (let prefix = 0; prefix < 2 ** j; prefix++) for (let s = 0; s < N; s++) counts[run(s, steps - j, prefix).word]++;
    hybrids.push({ j, counts, samples, p: counts.map(c => c / samples) });
  }
  const range = new Set(hybrids[0].counts.flatMap((c, i) => c ? [i] : []));
  const accept = x => test === 'range' ? range.has(x) : test === 'parity' ? parity(x) === 0 : test === 'endpoints' ? (x & 1) === (x >>> (n + steps - 1)) : bits(x, n + steps).split('').filter(c => c === '1').length >= threshold;
  hybrids.forEach(h => { h.acceptance = sum(h.p.filter((_, i) => accept(i))); h.tv = sum(h.p.map(p => Math.abs(p - 1 / size))) / 2; });
  const signedGaps = hybrids.slice(1).map((h, i) => hybrids[i].acceptance - h.acceptance);
  return { n, N, size, g, steps, hybrids, signedGaps, totalGap: hybrids[0].acceptance - hybrids.at(-1).acceptance, sumAbsolute: sum(signedGaps.map(Math.abs)), run: run(seed, steps), range: [...range] };
}
export function linearHash(x, rows) { return rows.reduce((z, r) => 2 * z + dot(x, r), 0); }
export function extraction(table, sampled, outputBits, selectedRows) {
  const n = Math.log2(table.length), f = functionTable(table, n), N = f.length;
  integer(sampled, 0, N - 1, 'selected input'); integer(outputBits, 1, n, 'hash output bits');
  const rows = numbers(selectedRows, n, 0, N - 1, 'hash row masks').slice(0, outputBits), M = 2 ** outputBits;
  const groups = fibers(f), familySize = N ** outputBits;
  const tvOf = (fiber, h) => { const counts = Array(M).fill(0); fiber.forEach(x => counts[linearHash(x, h)]++); const p = counts.map(c => c / fiber.length); return { counts, p, tv: sum(p.map(q => Math.abs(q - 1 / M))) / 2 }; };
  const summary = groups.map((fiber, y) => {
    if (!fiber.length) return null;
    let total = 0;
    for (let a = 0; a < familySize; a++) { let code = a; const h = Array.from({ length: outputBits }, () => { const r = code % N; code = Math.floor(code / N); return r; }); total += tvOf(fiber, h).tv; }
    return { y, fiber, K: fiber.length, conditionalEntropy: Math.log2(fiber.length), averageTV: total / familySize, bound: Math.min(1, .5 * Math.sqrt(M / fiber.length)), selected: tvOf(fiber, rows) };
  }).filter(Boolean);
  const Houtput = entropy(groups.map(a => a.length / N)), Hconditional = sum(summary.map(a => a.K / N * a.conditionalEntropy));
  return { n, N, M, rows, familySize, summary, selected: summary.find(a => a.y === f[sampled]), Houtput, Hconditional,
    conditionalTV: sum(summary.map(a => a.K / N * a.averageTV)), bound: sum(summary.map(a => a.K / N * a.bound)) };
}
export function queryWords(value) {
  const a = typeof value === 'string' ? value.trim().split(/[\s,]+/) : Array.isArray(value) ? Array.from(value) : value;
  if (!Array.isArray(a) || a.length < 1 || a.length > 8 || a.some(x => typeof x !== 'string' || !/^[01]{1,5}$/.test(x)) || a.some(x => x.length !== a[0].length)) throw new Error('Use one to eight binary queries of the same length, from one to five bits.');
  return a;
}
export function ggm(table, seed, queries) {
  const N = table.length, n = Math.log2(N); integer(n, 1, 4, 'label bits');
  const g = numbers(table, N, 0, N * N - 1, 'doubling generator'); integer(seed, 0, N - 1, 'root seed');
  const words = queryWords(queries), labels = new Map([['', seed]]), expanded = new Set(), outputs = [];
  const trace = [{ query: null, prefix: '', label: seed, evaluations: 0, fresh: false }];
  words.forEach((word, query) => {
    let prefix = '';
    for (const bit of word) {
      const fresh = !expanded.has(prefix);
      if (fresh) { const z = g[labels.get(prefix)]; labels.set(prefix + '0', Math.floor(z / N)); labels.set(prefix + '1', z % N); expanded.add(prefix); }
      prefix += bit; trace.push({ query, prefix, label: labels.get(prefix), evaluations: expanded.size, fresh });
    }
    outputs.push(labels.get(word));
  });
  return { n, N, words, outputs, trace, labels: [...labels].map(([prefix, label]) => ({ prefix, label })), evaluations: expanded.size, depth: words[0].length };
}
export function feistel(roundTables, value, inverse = false) {
  if (!Array.isArray(roundTables) || roundTables.length < 1 || roundTables.length > 4) throw new Error('Use one to four round functions.');
  const N = roundTables[0].length, n = Math.log2(N); integer(n, 1, 3, 'half-block bits');
  const tables = Array.from(roundTables, a => numbers(a, N, 0, N - 1, 'round function')); integer(value, 0, N * N - 1, 'block');
  let L = Math.floor(value / N), R = value % N; const trace = [{ L, R, round: inverse ? tables.length : 0 }];
  if (!inverse) tables.forEach((f, i) => { [L, R] = [R, L ^ f[R]]; trace.push({ L, R, round: i + 1 }); });
  else for (let i = tables.length - 1; i >= 0; i--) { [L, R] = [R ^ tables[i][L], L]; trace.push({ L, R, round: i }); }
  return { value: L * N + R, L, R, trace };
}
export function idealInverseAttack(N, delta = 1) {
  integer(N, 2, 8, 'half-block alphabet'); integer(Math.log2(N), 1, 3, 'half-block bits'); integer(delta, 1, N - 1, 'nonzero difference');
  // Condition on the first two distinct outputs of a uniform permutation; then sample its inverse lazily.
  const a = 0, b = delta * N, size = N * N; let probability = 0;
  for (let A = 0; A < size; A++) for (let B = 0; B < size; B++) if (A !== B) {
    const S = Math.floor(A / N), S2 = Math.floor(B / N), c = S * N + ((A % N) ^ delta), target = S ^ S2;
    if (c === B) probability += +(b % N === target);
    else { let wins = 0; for (let x = 0; x < size; x++) if (x !== a && x !== b && x % N === target) wins++; probability += wins / (size - 2); }
  }
  return probability / (size * (size - 1));
}
export function feistelExperiment(roundTables, plaintext, delta = 1) {
  const N = roundTables[0].length; integer(delta, 1, N - 1, 'nonzero difference');
  const first = feistel(roundTables, plaintext), secondInput = plaintext ^ (delta * N), second = feistel(roundTables, secondInput);
  const changed = first.L * N + (first.R ^ delta), recovered = feistel(roundTables, changed, true);
  const targetRight = plaintext % N ^ first.L ^ second.L;
  const rounds = roundTables.length, projection = first.L === plaintext % N, differential = (first.L ^ second.L) === delta;
  return { N, rounds, first, secondInput, second, changed, recovered, targetRight, projection, differential,
    inverseRelation: recovered.R === targetRight, idealProjection: 1 / N, idealDifferential: N / (N * N - 1), idealInverse: idealInverseAttack(N, delta),
    randomRoundForward: rounds === 1 ? 1 : rounds === 2 ? 1 : rounds === 3 ? 1 / N : null };
}
export function candidateAttack(kind, options) {
  if (kind === 'factor') {
    const { p, q } = options; integer(p, 2, 97, 'first prime'); integer(q, 2, 97, 'second prime');
    const prime = x => { for (let d = 2; d * d <= x; d++) if (x % d === 0) return false; return true; };
    if (!prime(p) || !prime(q)) throw new Error('Both factors must be primes from 2 to 97.');
    const target = p * q, trace = []; let answer = null;
    for (let d = 2; d * d <= target; d++) { trace.push({ candidate: d, value: target % d, match: target % d === 0 }); if (target % d === 0) { answer = [d, target / d]; break; } }
    return { kind, target, trace, answer, forwardOperations: 1, operation: 'integer remainder tests' };
  }
  if (kind === 'log') {
    const { modulus, base, exponent } = options; integer(modulus, 3, 97, 'modulus'); integer(base, 1, modulus - 1, 'base'); integer(exponent, 0, modulus - 2, 'exponent');
    for (let d = 2; d * d <= modulus; d++) if (modulus % d === 0) throw new Error('Use a prime modulus.');
    let target = 1, a = base, e = exponent, forwardOperations = 0;
    while (e) { if (e & 1) { target = target * a % modulus; forwardOperations++; } e >>>= 1; if (e) { a = a * a % modulus; forwardOperations++; } }
    const trace = []; let power = 1, answer = null;
    for (let x = 0; x <= modulus - 2; x++) { trace.push({ candidate: x, value: power, match: power === target }); if (power === target) { answer = x; break; } power = power * base % modulus; }
    return { kind, target, trace, answer, forwardOperations, operation: 'candidate comparisons; one modular multiply between candidates' };
  }
  if (kind === 'subset') {
    const weights = numbers(options.weights, 6, 0, 100, 'six subset weights'), mask = integer(options.mask, 0, 63, 'subset mask');
    const value = m => sum(weights.filter((_, i) => m & (1 << i))), target = value(mask), trace = []; let answer = null;
    for (let x = 0; x < 64; x++) { const z = value(x); trace.push({ candidate: x, value: z, match: z === target }); if (z === target) { answer = x; break; } }
    return { kind, target, trace, answer, forwardOperations: weights.filter((_, i) => mask & (1 << i)).length, operation: 'subset candidates (each recomputed from its selected weights)' };
  }
  throw new Error('Unknown candidate family.');
}
export const PRIMITIVES = ['OWF', 'PRG', 'PRF', 'PRP', 'MAC', 'CPA encryption'];
export const REDUCTIONS = [
  { from: 'OWF', to: 'PRG', label: 'HILL; general construction', deep: true },
  { from: 'PRG', to: 'OWF', label: 'stretch to 2n; verify inverter outputs' },
  { from: 'PRG', to: 'PRF', label: 'GGM; lazy polynomial query tree' },
  { from: 'PRF', to: 'PRG', label: 'concatenate enough distinct evaluations' },
  { from: 'PRF', to: 'PRP', label: 'three independent Feistel keys' },
  { from: 'PRP', to: 'PRG', label: 'distinct blocks; permutation switching' },
  { from: 'PRF', to: 'MAC', label: 'tag a message with its PRF value' },
  { from: 'PRF', to: 'CPA encryption', label: 'fresh random nonce and PRF pad' },
  { from: 'MAC', to: 'OWF', label: 'necessity theorem; distributional inversion', deep: true },
  { from: 'CPA encryption', to: 'OWF', label: 'necessity theorem; distributional inversion', deep: true },
];
export function reductionPath(from, to) {
  if (!PRIMITIVES.includes(from) || !PRIMITIVES.includes(to)) throw new Error('Unknown primitive.');
  const queue = [[from, []]], seen = new Set([from]);
  while (queue.length) { const [here, path] = queue.shift(); if (here === to) return path; for (const e of REDUCTIONS.filter(e => e.from === here)) if (!seen.has(e.to)) { seen.add(e.to); queue.push([e.to, [...path, e]]); } }
  return null;
}
export function toyAuthentication(table, secret, observed, target) {
  const g = numbers(table, 8, 0, 63, 'doubling generator'); integer(secret, 0, 7, 'secret key'); integer(target, 0, 7, 'fresh message');
  if (!Array.isArray(observed) || observed.length < 1 || observed.length > 7) throw new Error('Use one to seven observed message indices.');
  observed = numbers(observed, observed.length, 0, 7, 'observed message');
  if (observed.includes(target)) throw new Error('The forgery message must be fresh.');
  const evaluate = (key, message) => ggm(g, key, [bits(message, 3)]).outputs[0];
  const transcript = observed.map(message => ({ message, tag: evaluate(secret, message) }));
  const keys = Array.from({ length: 8 }, (_, k) => k).filter(k => transcript.every(({ message, tag }) => evaluate(k, message) === tag));
  const counts = Array(8).fill(0); keys.forEach(k => counts[evaluate(k, target)]++);
  const bestTag = counts.indexOf(Math.max(...counts));
  return { transcript, keys, counts, bestTag, success: counts[bestTag] / keys.length, actualTag: evaluate(secret, target) };
}
export const WORLDS = [
  { name: 'Algorithmica', different: false, average: false, owf: false, agreement: false },
  { name: 'Heuristica', different: true, average: false, owf: false, agreement: false },
  { name: 'Pessiland', different: true, average: true, owf: false, agreement: false },
  { name: 'Minicrypt', different: true, average: true, owf: true, agreement: false },
  { name: 'Cryptomania', different: true, average: true, owf: true, agreement: true },
];
export function averageSearch(table, hardMass) {
  const f = functionTable(table), N = f.length;
  if (!Number.isFinite(hardMass) || hardMass < 0 || hardMass > 1) throw new Error('The selected-instance probability must be in [0,1].');
  const costs = f.map(y => f.indexOf(y) + 1), hardest = costs.indexOf(Math.max(...costs));
  const probabilities = costs.map((_, i) => i === hardest ? hardMass : (1 - hardMass) / (N - 1));
  return { costs, hardest, probabilities, maximum: Math.max(...costs), average: sum(costs.map((c, i) => c * probabilities[i])) };
}
