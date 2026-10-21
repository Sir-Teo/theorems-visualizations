// Bounded log2(3/2) example. The theorem is proved in the item; these
// binary64 evaluations illustrate its first seven noninitial convergents.
export const CF_ALPHA = Math.log2(3 / 2);
export const CF_QUOTIENTS = Object.freeze([0, 1, 1, 2, 2, 3, 1, 5, 2, 23]);
let pp = 0, p = 1, qq = 1, q = 0;
export const CF_CONVERGENTS = Object.freeze(CF_QUOTIENTS.map(a => {
  [pp, p] = [p, a * p + pp]; [qq, q] = [q, a * q + qq];
  return Object.freeze({ p, q });
}));
export const CF_POINTS = Object.freeze(Array.from({ length: 665 }, (_, i) => {
  const q = i + 1, p = Math.round(q * CF_ALPHA);
  return Object.freeze({ p, q, signed: q * CF_ALPHA - p });
}));
export function continuedModel(k = 4) {
  if (!Number.isInteger(k) || k < 1 || k > 7) throw new RangeError('Convergent index must be an integer from 1 to 7');
  const current = CF_CONVERGENTS[k], next = CF_CONVERGENTS[k + 1];
  const signed = current.q * CF_ALPHA - current.p, error = Math.abs(signed);
  let minimum = Infinity, minimizer = 0;
  for (const x of CF_POINTS) if (x.q < next.q && Math.abs(x.signed) < minimum) {
    minimum = Math.abs(x.signed); minimizer = x.q;
  }
  return { k, current, next, signed, error, bound: 1 / next.q, minimum, minimizer,
    rows: CF_CONVERGENTS.slice(0, 9).map((x, i) => ({ ...x, k: i,
      a: CF_QUOTIENTS[i], error: Math.abs(x.q * CF_ALPHA - x.p) })), points: CF_POINTS };
}
