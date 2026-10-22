// Finite and explicit models for TOP 6. Infinite assertions remain in the proofs.
export const source = n => `https://faculty.etsu.edu/gardnerr/5357/Beamer-Proofs/Proofs-Munkres-${n}-print.pdf`;
export const scope = 'Normal and regular include T₁, as in TOP 5.7. Products have the product topology. The general existence results use the usual choice-based foundations; finite pictures illustrate specified constructions, not all spaces.';
export const clamp = x => Math.max(0, Math.min(1, x));
export const sum = a => a.reduce((s, x) => s + x, 0);
export const dist = (a, b) => Math.hypot(...a.map((x, i) => x - b[i]));
export const colors = ['accent', 'orange', 'green', 'purple', 'teal', 'gold'];
export const ramp = (x, gap) => clamp(x / gap + .5);
export const distanceTo = (x, a) => Math.min(...a.map(y => Math.abs(x - y)));

// Urysohn's +/-M/3 correction, with the empty-set cases handled explicitly.
export function correction(nodes, residual, bound) {
  const minus = nodes.filter((_, i) => residual[i] <= -bound / 3);
  const plus = nodes.filter((_, i) => residual[i] >= bound / 3);
  const value = x => {
    if (!plus.length) return minus.length ? -bound / 3 : 0;
    if (!minus.length) return bound / 3;
    const a = distanceTo(x, minus), b = distanceTo(x, plus);
    return bound / 3 * (a - b) / (a + b);
  };
  return {minus, plus, value, bound};
}
export function tietze(middle, steps) {
  const nodes = [-1, -.3, .4, 1], values = [.8, middle, -.65, .45];
  let residual = [...values];
  const terms = [], errors = [Math.max(...residual.map(Math.abs))];
  for (let k = 0; k < steps; k++) {
    const term = correction(nodes, residual, (2 / 3) ** k);
    terms.push(term); residual = residual.map((r, i) => r - term.value(nodes[i]));
    errors.push(Math.max(...residual.map(Math.abs)));
  }
  return {nodes, values, terms, residual, errors, bound: (2 / 3) ** steps,
    value: x => sum(terms.map(t => t.value(x)))};
}
export const bump = (x, center, radius) => Math.max(0, 1 - Math.abs(x - center) / radius);
export function finitePartition(x, radius, omit = false) {
  const raw = [0, .5, 1].map((c, i) => omit && i === 1 ? 0 : bump(x, c, radius));
  const total = sum(raw); return {raw, total, phi: raw.map(a => total ? a / total : 0)};
}
export const angleDifference = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
export function circleEmbedding(theta, keepOne = false) {
  const deltas = [0, 1, 2, 3].map(i => angleDifference(theta, i * Math.PI / 2));
  const raw = deltas.map(d => Math.max(0, 1 - Math.abs(d) / (Math.PI / 2)));
  const total = sum(raw), phi = raw.map(a => a / total);
  return {phi, deltas, coordinates: phi.flatMap((p, i) => keepOne && i !== 0 ? [0, 0] : [p, p * deltas[i]])};
}
export const circleCoordinate = (theta, n) => (1 + (n % 2 ? Math.cos((n + 1) / 2 * theta) : Math.sin(n / 2 * theta))) / 2;
export function coordinateMetric(a, b, n) {
  const terms = Array.from({length: n}, (_, j) => 2 ** (-j - 1) * Math.abs(circleCoordinate(a, j + 1) - circleCoordinate(b, j + 1)));
  return {terms, head: sum(terms), tail: 2 ** -n};
}
export const choiceSizes = [2, 3, 2];
export function choiceTuple(index) {
  return choiceSizes.map(n => { const a = index % (n + 1); index = Math.floor(index / (n + 1)); return a; });
}
export const choiceSurvivors = k => choiceSizes.reduce((p, n, i) => p * (n + (i < k ? 0 : 1)), 1);
export const subsequenceIndex = (kind, k) => kind === 'squares' ? k * k : kind === 'even' ? 2 * k : k;
export function digitWitness(kind, count) {
  const indices = Array.from({length: count}, (_, i) => subsequenceIndex(kind, i + 1));
  const last = indices.at(-1), bits = Array(last).fill(0);
  indices.forEach((n, i) => {bits[n - 1] = (i + 1) % 2;});
  let numerator = 0n; for (const b of bits) numerator = 2n * numerator + BigInt(b);
  return {indices, bits, numerator, denominator: 2n ** BigInt(last), prefix: sum(bits.map((b, i) => b * 2 ** (-i - 1))), tail: 2 ** -last};
}
export function cubeSequence(kind, m, visible = 12) {
  const head = kind === 'Cantor' ? 0 : 1 / (m + 1);
  return {values: Array.from({length: visible}, (_, j) => j < m ? head : 1),
    distance: head * (1 - 2 ** -m) + 2 ** -m, tail: 2 ** -visible};
}
export function localCount(x, eps, radius = .6) {
  // Retain the roundoff terms: adding an integer center to a radius can round
  // a strictly interior endpoint onto an integer (or the other way around).
  const lo = Math.floor(x - radius - eps) - 1, hi = Math.ceil(x + radius + eps) + 1;
  return Array.from({length: hi - lo + 1}, (_, j) => lo + j).filter(k =>
    exactSumSign([k, -x, -radius, -eps]) < 0 && exactSumSign([k, -x, radius, eps]) > 0);
}
function exactSumSign(terms) {
  let expansion = [];
  for (let q of terms) {
    const next = [];
    for (const e of expansion) {
      const s = q + e, b = s - q, error = (q - (s - b)) + (e - b);
      if (error) next.push(error);
      q = s;
    }
    if (q || !next.length) next.push(q);
    expansion = next;
  }
  return Math.sign(expansion.at(-1));
}
export function linePartition(x) {
  const k = Math.floor(x), t = x - k;
  return {indices: [k, k + 1], weights: [1 - t, t], square: (1 - t) * k * k + t * (k + 1) ** 2, error: t * (1 - t)};
}
export function basisWitness(x, eps) {
  for (let n = 0; n < 40; n++) {
    const h = 2 ** -n, k = Math.round(x / h), center = k * h, radius = .75 * h;
    if (Math.abs(x - center) + radius < eps) return {n, k, center, radius, slack: eps - Math.abs(x - center) - radius};
  }
  throw new RangeError('Witness outside the displayed parameter domain');
}
export function patchCoordinates(x) {
  const a = clamp(.5 - x), b = 1 - a;
  return [a, a * x, b, b * Math.atan(x)];
}
