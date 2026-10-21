// Scoped 2x2 illustration: integer entries match the offered edit control.
export const ENVELOPE_GAMES = {
  pennies: { label: 'Matching Pennies', A: [[1, -1], [-1, 1]] },
  skew: { label: 'skew game', A: [[2, -3], [-1, 4]] },
  saddle2: { label: 'saddle point', A: [[3, 2], [1, 0]] },
  dom: { label: 'column 2 dominated', A: [[4, 6], [-2, 5]] },
  flat: { label: 'all entries equal', A: [[2, 2], [2, 2]] },
};

export const validEnvelopeMatrix = A => Array.isArray(A) && A.length === 2 && [0, 1].every(i => Array.isArray(A[i]) && A[i].length === 2 && [0, 1].every(j => Number.isInteger(A[i][j]) && Math.abs(A[i][j]) <= 9));

/** A lower/upper envelope of two affine functions is linear between its endpoints and their intersection. */
export function twoByTwoEnvelopes(A) {
  if (!validEnvelopeMatrix(A)) throw new RangeError('the illustration requires a 2x2 integer matrix with entries from -9 to 9');
  const [[a,b],[c,d]] = A, den = a - b - c + d;
  const candidates = t => [...new Set([0, 1, ...(Number.isFinite(t) && t >= 0 && t <= 1 ? [t] : [])])].sort((x,y) => x-y);
  const ps = candidates(den ? (d-c)/den : NaN), qs = candidates(den ? (d-b)/den : NaN);
  const guarantee = p => Math.min(c + (a-c)*p, d + (b-d)*p);
  const ceiling = q => Math.max(b + (a-b)*q, d + (c-d)*q);
  const lower = Math.max(...ps.map(guarantee)), upper = Math.min(...qs.map(ceiling));
  // Distinct integer-input candidate values differ far more than roundoff.
  // This tolerance identifies a flat optimum; it never manufactures a gap.
  const tolerance = 128 * Number.EPSILON * (1 + Math.max(...A.flat().map(Math.abs)));
  const interval = (xs,f,v) => { const hit = xs.filter(x => Math.abs(f(x)-v) <= tolerance); return [Math.min(...hit), Math.max(...hit)]; };
  const pOptimal = interval(ps, guarantee, lower), qOptimal = interval(qs, ceiling, upper);
  const pureLower = Math.max(Math.min(a,b), Math.min(c,d)), pureUpper = Math.min(Math.max(a,c), Math.max(b,d));
  const saddles = [];A.forEach((r,i) => r.forEach((x,j) => { if (x === Math.min(...r) && x === Math.max(A[0][j],A[1][j])) saddles.push([i,j]); }));
  return { ps, qs, guarantee, ceiling, lower, upper, difference: Math.abs(upper-lower), tolerance,
    pOptimal, qOptimal, p: (pOptimal[0]+pOptimal[1])/2, q: (qOptimal[0]+qOptimal[1])/2,
    value: (lower+upper)/2, pureLower, pureUpper, saddles,
    rowCurve: ps.map(p => [p, guarantee(p)]), columnCurve: qs.map(q => [q, ceiling(q)]) };
}
