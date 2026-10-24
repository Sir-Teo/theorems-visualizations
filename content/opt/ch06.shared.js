// Small exact-rational LP dictionaries. These are pedagogical traces, not a production solver.
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
export function R(n, d = 1n) {
  if (typeof n === 'object' && n !== null && 'n' in n) return n;
  if (typeof n === 'number' && !Number.isSafeInteger(n)) throw new RangeError('Use an explicit rational for noninteger data');
  n = BigInt(n); d = BigInt(d);
  if (!d) throw new RangeError('Zero rational denominator');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d); return { n: n / g, d: d / g };
}
export const add = (a, b) => { a = R(a); b = R(b); return R(a.n * b.d + b.n * a.d, a.d * b.d); };
export const neg = a => { a = R(a); return R(-a.n, a.d); };
export const sub = (a, b) => add(a, neg(b));
export const mul = (a, b) => { a = R(a); b = R(b); return R(a.n * b.n, a.d * b.d); };
export const div = (a, b) => { a = R(a); b = R(b); return R(a.n * b.d, a.d * b.n); };
export const cmp = (a, b) => { a = R(a); b = R(b); const z = a.n * b.d - b.n * a.d; return z > 0n ? 1 : z < 0n ? -1 : 0; };
export const num = a => { a = R(a); const x = Number(a.n) / Number(a.d); if (!Number.isFinite(x)) throw new RangeError('Display number outside bounded model'); return x; };
export const str = a => { a = R(a); return a.d === 1n ? String(a.n) : `${a.n}/${a.d}`; };
export const dot = (a, b) => a.reduce((s, x, i) => add(s, mul(x, b[i])), R(0));
const eye = n => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => R(+(i === j))));
const copy = A => A.map(r => r.slice());
const ids = n => Array.from({ length: n }, (_, j) => j);
export function standard(A, b, c, labels) {
  if (!A.length || A.length !== b.length || A.some(r => r.length !== c.length)) throw new RangeError('LP dimensions');
  return { A: A.map(r => r.map(x => R(x))), b: b.map(x => R(x)), c: c.map(x => R(x)), labels: labels || c.map((_, j) => `x${j + 1}`) };
}
export function inequalities(A, b, c) {
  const m = b.length, n = c.length;
  return standard(A.map((r, i) => [...r, ...ids(m).map(j => +(i === j))]), b, [...c, ...Array(m).fill(0)], [...ids(n).map(j => `x${j + 1}`), ...ids(m).map(j => `s${j + 1}`)]);
}
function complete(lp, basis, rows, rhs, ops) {
  const cb = basis.map(j => lp.c[j]), x = lp.c.map(() => R(0));
  basis.forEach((j, i) => x[j] = rhs[i]);
  const reduced = lp.c.map((c, j) => sub(c, dot(cb, rows.map(r => r[j]))));
  const y = lp.b.map((_, j) => dot(cb, ops.map(r => r[j])));
  return { lp, basis, rows, rhs, ops, x, reduced, y, value: dot(cb, rhs), primal: rhs.every(x => cmp(x, 0) >= 0), dual: reduced.every(x => cmp(x, 0) >= 0) };
}
export function basisState(lp, basis) {
  const m = lp.b.length;
  if (basis.length !== m || new Set(basis).size !== m || basis.some(j => !Number.isInteger(j) || j < 0 || j >= lp.c.length)) throw new RangeError('Invalid basis');
  const rows = copy(lp.A), rhs = lp.b.slice(), ops = eye(m);
  for (let k = 0; k < m; k++) {
    const p = rows.findIndex((r, i) => i >= k && cmp(r[basis[k]], 0) !== 0);
    if (p < 0) return null;
    [rows[k], rows[p]] = [rows[p], rows[k]]; [rhs[k], rhs[p]] = [rhs[p], rhs[k]]; [ops[k], ops[p]] = [ops[p], ops[k]];
    const a = rows[k][basis[k]];
    rows[k] = rows[k].map(x => div(x, a)); rhs[k] = div(rhs[k], a); ops[k] = ops[k].map(x => div(x, a));
    for (let i = 0; i < m; i++) if (i !== k) {
      const t = rows[i][basis[k]];
      rows[i] = rows[i].map((x, j) => sub(x, mul(t, rows[k][j]))); rhs[i] = sub(rhs[i], mul(t, rhs[k])); ops[i] = ops[i].map((x, j) => sub(x, mul(t, ops[k][j])));
    }
  }
  return complete(lp, basis.slice(), rows, rhs, ops);
}
export function pivot(s, enter, leave) {
  if (s.basis.includes(enter) || !s.rows[leave] || cmp(s.rows[leave][enter], 0) === 0) throw new RangeError('Invalid pivot');
  const rows = copy(s.rows), rhs = s.rhs.slice(), ops = copy(s.ops), basis = s.basis.slice(), a = rows[leave][enter];
  rows[leave] = rows[leave].map(x => div(x, a)); rhs[leave] = div(rhs[leave], a); ops[leave] = ops[leave].map(x => div(x, a));
  for (let i = 0; i < rows.length; i++) if (i !== leave) {
    const t = rows[i][enter];
    rows[i] = rows[i].map((x, j) => sub(x, mul(t, rows[leave][j]))); rhs[i] = sub(rhs[i], mul(t, rhs[leave])); ops[i] = ops[i].map((x, j) => sub(x, mul(t, ops[leave][j])));
  }
  basis[leave] = enter; return complete(s.lp, basis, rows, rhs, ops);
}
export function ratio(s, enter) {
  const candidates = s.rhs.flatMap((b, i) => cmp(s.rows[i][enter], 0) > 0 ? [{ row: i, theta: div(b, s.rows[i][enter]) }] : []);
  candidates.sort((a, b) => cmp(a.theta, b.theta) || s.basis[a.row] - s.basis[b.row]);
  return candidates[0] || null;
}
export function choices(s) {
  return s.reduced.flatMap((r, j) => cmp(r, 0) < 0 ? [{ enter: j, rate: neg(r), ...ratio(s, j), unbounded: ratio(s, j) === null }] : []);
}
export function choose(s, rule = 'Dantzig') {
  if (!['Dantzig', 'Bland', 'smallest positive rate', 'greatest immediate gain'].includes(rule)) throw new RangeError('Unknown pivot rule');
  const c = choices(s);
  if (!c.length) return null;
  c.sort((a, b) => {
    if (rule === 'Bland') return a.enter - b.enter;
    if (rule === 'smallest positive rate') return cmp(a.rate, b.rate) || a.enter - b.enter;
    if (rule === 'greatest immediate gain') {
      if (a.unbounded || b.unbounded) return Number(b.unbounded) - Number(a.unbounded) || a.enter - b.enter;
      return cmp(mul(b.rate, b.theta), mul(a.rate, a.theta)) || a.enter - b.enter;
    }
    if (rule !== 'Dantzig') throw new RangeError('Unknown pivot rule');
    return cmp(b.rate, a.rate) || a.enter - b.enter;
  });
  return c[0];
}
export function primal(lp, basis, rule = 'Dantzig', budget = 128) {
  let s = Array.isArray(basis) ? basisState(lp, basis) : basis;
  if (!s?.primal) throw new RangeError('Primal simplex needs a feasible basis');
  const history = [s], seen = new Set([s.basis.slice().sort((a, b) => a - b).join(',')]);
  for (let k = 0; k <= budget; k++) {
    const decision = choose(s, rule); s.decision = decision;
    if (!decision) return { history, status: 'optimal' };
    if (decision.unbounded) {
      const ray = lp.c.map(() => R(0)); ray[decision.enter] = R(1); s.basis.forEach((j, i) => ray[j] = neg(s.rows[i][decision.enter]));
      return { history, status: 'unbounded', ray };
    }
    if (k === budget) return { history, status: 'budget exhausted' };
    s = pivot(s, decision.enter, decision.row); history.push(s);
    const key = s.basis.slice().sort((a, b) => a - b).join(',');
    if (seen.has(key)) return { history, status: 'repeated basis' }; seen.add(key);
  }
}
export function dual(lp, basis, budget = 128) {
  let s = Array.isArray(basis) ? basisState(lp, basis) : basis;
  if (!s?.dual) throw new RangeError('Dual simplex needs nonnegative reduced costs');
  const history = [s], seen = new Set();
  for (let k = 0; k <= budget; k++) {
    if (s.primal) return { history, status: 'optimal' };
    const key = s.basis.slice().sort((a, b) => a - b).join(',');
    if (seen.has(key)) return { history, status: 'repeated basis' }; seen.add(key);
    const leave = ids(s.rhs.length).filter(i => cmp(s.rhs[i], 0) < 0).sort((i, j) => cmp(s.rhs[i], s.rhs[j]) || s.basis[i] - s.basis[j])[0];
    const candidates = s.reduced.flatMap((r, j) => cmp(s.rows[leave][j], 0) < 0 ? [{ enter: j, ratio: div(r, neg(s.rows[leave][j])) }] : []).sort((a, b) => cmp(a.ratio, b.ratio) || a.enter - b.enter);
    if (!candidates.length) return { history, status: 'infeasible', certificate: s.ops[leave] };
    s.decision = { enter: candidates[0].enter, row: leave, theta: candidates[0].ratio };
    if (k === budget) return { history, status: 'budget exhausted' };
    s = pivot(s, s.decision.enter, leave); history.push(s);
  }
}
export function combinations(n, k) {
  const out = []; const visit = (start, a) => { if (a.length === k) { out.push(a); return; } for (let j = start; j <= n - k + a.length; j++) visit(j + 1, [...a, j]); }; visit(0, []); return out;
}
export function enumerate(lp) {
  const bases = combinations(lp.c.length, lp.b.length).map(b => ({ basis: b, state: basisState(lp, b) }));
  const feasible = bases.flatMap(b => b.state?.primal ? [b.state] : []);
  const optimal = feasible.slice().sort((a, b) => cmp(a.value, b.value))[0];
  return { bases, feasible, optimal };
}
export function phaseOne(lp) {
  const m = lp.b.length, n = lp.c.length, signs = lp.b.map(b => cmp(b, 0) < 0 ? -1 : 1);
  const auxiliary = standard(lp.A.map((r, i) => [...r.map(x => mul(signs[i], x)), ...ids(m).map(j => +(i === j))]), lp.b.map((b, i) => mul(b, signs[i])), [...Array(n).fill(0), ...Array(m).fill(1)], [...lp.labels, ...ids(m).map(i => `a${i + 1}`)]);
  const run = primal(auxiliary, ids(m).map(i => n + i), 'Bland'), last = run.history.at(-1);
  if (run.status !== 'optimal') return { ...run, cleanup: [], status: 'auxiliary ' + run.status };
  if (cmp(last.value, 0) > 0) return { ...run, cleanup: [], status: 'infeasible', certificate: last.y.map((y, i) => mul(-signs[i], y)) };
  let s = last; const cleanup = [];
  for (let i = 0; i < s.basis.length;) {
    if (s.basis[i] < n) { i++; continue; }
    const enter = ids(n).find(j => !s.basis.includes(j) && cmp(s.rows[i][j], 0) !== 0);
    if (enter !== undefined) { s = pivot(s, enter, i); cleanup.push({ action: 'pivot out zero artificial', state: s }); i++; }
    else {
      s = complete(s.lp, s.basis.filter((_, j) => j !== i), s.rows.filter((_, j) => j !== i), s.rhs.filter((_, j) => j !== i), s.ops.filter((_, j) => j !== i));
      cleanup.push({ action: 'remove redundant zero equation', state: s });
    }
  }
  const cleaned = complete(lp, s.basis, s.rows.map(r => r.slice(0, n)), s.rhs, s.ops.map(r => r.map((x, i) => mul(x, signs[i]))));
  return { ...run, status: 'feasible', cleanup, cleaned };
}

export const polygonLP = (cx = 3, cy = 2) => inequalities([[1, 1], [1, 0], [0, 1]], [4, 3, 3], [-cx, -cy]);
export const spatialLP = (firstProfit = 3) => inequalities([[1, 1, 1], [2, 1, 0], [0, 1, 2]], [5, 6, 7], [-firstProfit, -2, -4]);
// Keep the source row scaling: rescaling rows changes slack-variable reduced costs
// and can destroy this particular largest-reduced-cost cycle.
export const cyclingLP = () => inequalities([[R(1, 2), R(-7, 2), -2, 4], [R(1, 2), -1, R(-1, 2), R(1, 2)], [1, 0, 0, 0]], [0, 0, 1], [-1, 2, 0, 2]);
export function kleeMinty(n) {
  if (!Number.isInteger(n) || n < 1 || n > 6) throw new RangeError('Klee–Minty dimension 1..6');
  return inequalities(ids(n).map(i => ids(n).map(j => j < i ? 2 ** (i - j + 1) : +(i === j))), ids(n).map(i => 100 ** i), ids(n).map(j => -(2 ** (n - 1 - j))));
}
export function phaseExample(mode = 'feasible', demand = 3) {
  if (mode === 'redundant') return standard([[1, 1], [2, 2]], [3, 6], [-1, -2]);
  if (mode === 'zero row') return standard([[1, 1], [0, 0]], [3, 0], [-1, -2]);
  return inequalities([[-1, -1], [1, 1]], [-demand, mode === 'infeasible' ? 2 : 5], [-1, -2]);
}
export function cutExample(cap = 2) {
  const original = inequalities([[1, 2], [2, 1]], [8, 8], [-3, -2]);
  const initial = primal(original, [2, 3]).history.at(-1);
  const lp = inequalities([[1, 2], [2, 1], [1, 0]], [8, 8, cap], [-3, -2]);
  return { lp, run: dual(lp, [...initial.basis, 4]), original: initial };
}
export function transport(supply = 4, edge = 0, cost = 1, assignment = false, equalCosts = false) {
  const rows = assignment ? 3 : 2, cols = 3, n = rows * cols;
  if (!Number.isInteger(supply) || supply < 0 || supply > 8 || !Number.isInteger(edge) || edge < 0 || edge >= n || !Number.isSafeInteger(cost)) throw new RangeError('Transport controls outside their finite domain');
  const supplies = assignment ? [1, 1, 1] : [supply, 8 - supply], demands = assignment ? [1, 1, 1] : [2, 3, 3];
  const costs = (assignment ? [2, 5, 1, 3, 2, 4, 5, 1, 3] : [1, 4, 2, 3, 1, 5]).map(x => equalCosts ? 1 : x);
  if (!equalCosts) costs[edge] = cost;
  // One demand equation is redundant because total supply equals total demand.
  const A = [...ids(rows).map(i => ids(n).map(k => +(Math.floor(k / cols) === i))), ...ids(cols - 1).map(j => ids(n).map(k => +(k % cols === j)))];
  const lp = standard(A, [...supplies, ...demands.slice(0, -1)], costs), result = enumerate(lp);
  const optima = result.feasible.filter(s => cmp(s.value, result.optimal.value) === 0);
  const unique = [...new Map(optima.map(s => [s.x.map(str).join(','), s])).values()];
  return { lp, ...result, optima: unique, rows, cols, supplies, demands, costs };
}
export function production(deltaTenths = 0) {
  if (!Number.isInteger(deltaTenths) || deltaTenths < -70 || deltaTenths > 120) throw new RangeError('Capacity change in tenths');
  const delta = R(deltaTenths, 10), lp = inequalities([[1, 2], [2, 1]], [add(8, delta), 8], [-3, -2]);
  const result = enumerate(lp), baseValue = R(40, 3), prediction = add(baseValue, div(delta, 3)), actual = neg(result.optimal.value);
  return { lp, ...result, delta, actual, prediction, change: sub(actual, baseValue), prices: result.optimal.y.map(neg), basisValid: cmp(delta, -4) >= 0 && cmp(delta, 8) <= 0 };
}
export function distinctVertices(states, dimension) {
  return [...new Map(states.map(s => [s.x.slice(0, dimension).map(str).join(','), s.x.slice(0, dimension)])).values()];
}
