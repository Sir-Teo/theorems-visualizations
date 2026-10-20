// Numerical certificates and Robinson's two update timings. Neither routine is a proof of convergence.
const sum = a => a.reduce((s, x) => s + x, 0);
function dimensions(A) {
  if (!Array.isArray(A) || !A.length || !Array.isArray(A[0]) || !A[0].length || A.some(r => r.length !== A[0].length || r.some(x => !Number.isFinite(x)))) throw new TypeError('A must be a nonempty finite rectangular matrix');
  return [A.length, A[0].length];
}
export const MINIMAX_BIAS = [[0, -2, 3], [2, 0, -1], [-3, 1, 0]];
export const FICTITIOUS_GAMES = {
  rps: { label: 'Rock–Paper–Scissors', A: [[0, -1, 1], [1, 0, -1], [-1, 1, 0]] },
  skew: { label: 'skew-symmetric', A: MINIMAX_BIAS },
  saddle: { label: 'saddle point', A: [[1, 2, 6], [4, 3, 5], [7, 1, 0]] },
  fixed: { label: 'fixed mixed game', A: [[3, -2, 1], [-1, 4, -3], [-4, 0, 2]] },
};

/** Check a computed primal/dual pair against the original inequalities and its normalized security levels. */
export function lpGameCertificate(A, solution, tolerance = 1e-8) {
  const [m, n] = dimensions(A), S = solution;
  if (!(tolerance > 0 && Number.isFinite(tolerance))) throw new RangeError('positive finite tolerance required');
  const vector = (x, k) => Array.isArray(x) && x.length === k && x.every(Number.isFinite);
  if (!S || !Number.isFinite(S.s) || !Number.isFinite(S.v) || !vector(S.z, n) || !vector(S.w, m) || !vector(S.x, m) || !vector(S.y, n)) return { ok: false, reason: 'invalid solver output' };
  const B = A.map(r => r.map(a => a + S.s)), minB = Math.min(...B.flat()), primal = sum(S.z), dual = sum(S.w);
  if (!(minB > 0 && primal > 0 && dual > 0)) return { ok: false, reason: 'positive shift and positive objectives required' };
  const constraintResidual = Math.max(0, ...S.z.map(x => -x), ...S.w.map(x => -x), ...B.map(r => sum(r.map((a, j) => a * S.z[j])) - 1), ...B[0].map((_, j) => 1 - sum(B.map((r, i) => r[j] * S.w[i]))));
  const normalizationResidual = Math.max(Math.abs(sum(S.x) - 1), Math.abs(sum(S.y) - 1), ...S.x.map((x, i) => Math.abs(x - S.w[i] / dual)), ...S.y.map((y, j) => Math.abs(y - S.z[j] / primal)), ...S.x.map(x => -x), ...S.y.map(x => -x));
  const lower = Math.min(...A[0].map((_, j) => sum(A.map((r, i) => S.x[i] * r[j])))), upper = Math.max(...A.map(r => sum(r.map((a, j) => a * S.y[j]))));
  const objectiveGap = Math.abs(dual - primal), securityGap = upper - lower;
  const objectiveTolerance = tolerance * Math.max(1, primal, dual), payoffTolerance = tolerance * Math.max(1, ...A.flat().map(Math.abs));
  const valueResidual = Math.max(Math.abs(S.v - (1 / primal - S.s)), lower - S.v, S.v - upper, 0);
  return { ok: constraintResidual <= tolerance && normalizationResidual <= tolerance && objectiveGap <= objectiveTolerance && Math.abs(securityGap) <= payoffTolerance && valueResidual <= payoffTolerance,
    minB, primal, dual, constraintResidual, normalizationResidual, objectiveGap, securityGap, lower, upper, valueResidual, tolerance, objectiveTolerance, payoffTolerance };
}

const firstMax = a => a.reduce((best, x, i) => x > a[best] ? i : best, 0);
const firstMin = a => a.reduce((best, x, i) => x < a[best] ? i : best, 0);
/** Robinson (1951), Definition 1 and its p297 alternative, with zero initial vectors and first-index ties. */
export function fictitiousPlay(A, T, mode = 'simultaneous') {
  const [m, n] = dimensions(A);
  if (!Number.isInteger(T) || T < 1 || T > 100000) throw new RangeError('integer horizon in [1,100000] required');
  if (!['simultaneous', 'alternating'].includes(mode)) throw new RangeError('unknown update timing');
  const rows = Array(m).fill(0), columns = Array(n).fill(0), U = Array(n).fill(0), V = Array(m).fill(0);
  const X = [], Y = [], lo = [], hi = [], actions = [];
  for (let t = 1; t <= T; t++) {
    const i = firstMax(V);
    // Simultaneous: both see t−1 rounds. Alternating: the column also sees the new row i_t.
    const oldColumn = mode === 'simultaneous' ? firstMin(U) : null;
    rows[i]++;
    for (let c = 0; c < n; c++) U[c] += A[i][c];
    const j = oldColumn ?? firstMin(U);
    columns[j]++;
    for (let r = 0; r < m; r++) V[r] += A[r][j];
    actions.push([i, j]); X.push(rows.map(x => x / t)); Y.push(columns.map(y => y / t));
    lo.push(Math.min(...U) / t); hi.push(Math.max(...V) / t);
  }
  return { X, Y, lo, hi, actions, mode, horizon: T };
}

/** Full-record bounds, including nonmonotone excursions and room for endpoint markers on the log axis. */
export function fictitiousBounds(run, value) {
  const low = Math.min(value, ...run.lo), high = Math.max(value, ...run.hi), pad = Math.max(.2, (high - low) * .08);
  return { x: [.65, run.horizon * 1.55], y: [low - pad, high + pad] };
}
