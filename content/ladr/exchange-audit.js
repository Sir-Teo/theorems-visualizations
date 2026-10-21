// Axler 4e 2.22: a finite floating-point illustration in the fixed space R^3.
// The exact exchange argument is independent of these numerical thresholds.
export const EXCHANGE_POLICY = Object.freeze({ dependent: 1e-12, independent: 1e-7, residual: 1e-10, radius: 2 });
export const EXCHANGE_DEFAULT = {
  W: [[1.5, -.5, -.3], [-.3, 1.4, .2], [.5, -.4, 1.4], [-1.2, .2, -.6], [.6, .4, -1.3]],
  U: [[.84, -.23, 1.21], [-1.2, 1, .4], [.2, -1.2, -.9], [-.6, -1.4, .4]],
};
const copy = a => a.map(p => p.slice());
export function exchangePreset(key) {
  const W = copy(EXCHANGE_DEFAULT.W), U = copy(EXCHANGE_DEFAULT.U);
  if (key === 'parallel') { U[0] = [1, 0, 0]; U[1] = [1.5, 0, 0]; }
  else if (key === 'zero') U[0] = [0, 0, 0];
  else if (key === 'flat') W.forEach(p => { p[2] = 0; });
  else if (key === 'near') { U[0] = [1, 0, 0]; U[1] = [1, 1e-9, 0]; }
  else if (key !== 'valid') throw new Error('Unknown exchange preset.');
  return { W, U };
}
export const EXCHANGE_PRESETS = [
  ['valid', 'valid starting lists'], ['parallel', 'parallel u₁ and u₂'], ['zero', 'zero u₁'],
  ['flat', 'nonspanning W'], ['near', 'near dependence'],
];
export const validExchangeVectors = (a, n) => Array.isArray(a) && a.length === n && Array.from(a).every(p => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite) && Math.hypot(...p) <= EXCHANGE_POLICY.radius + 1e-12);
export const validExchangeState = d => !!d && validExchangeVectors(d.W, 5) && validExchangeVectors(d.U, 4) && typeof d.preset === 'string' && EXCHANGE_PRESETS.some(([k]) => k === d.preset) && Number.isFinite(d.yaw) && Math.abs(d.yaw) <= Math.PI && Number.isFinite(d.pitch) && Math.abs(d.pitch) <= 1.45;

// Normalize each nonzero column: changing a vector's nonzero length must not
// change its rank classification. Tiny subnormal inputs stop before division.
export function exchangeRank(M, vs) {
  const norms = vs.map(p => Math.hypot(...p));
  if (norms.some(n => n > 0 && n < 1e-150)) return { rank: null, upper: null, ambiguous: true, singular: [], ratio: null, norms, A: null };
  const A = [0, 1, 2].map(j => vs.map((p, i) => norms[i] ? p[j] / norms[i] : 0));
  const singular = vs.length ? M.svd(A).S : [], scale = singular[0] || 1;
  const rank = singular.filter(s => s > EXCHANGE_POLICY.independent * scale).length;
  const upper = singular.filter(s => s > EXCHANGE_POLICY.dependent * scale).length;
  return { rank, upper, ambiguous: rank !== upper, singular, ratio: singular.length ? singular.at(-1) / scale : 0, norms, A };
}

export function exchangePrefix(M, vs) {
  for (let k = 0; k < vs.length; k++) {
    const r = exchangeRank(M, vs.slice(0, k + 1));
    if (r.ambiguous) return { status: 'uncertain', k, rank: r };
    if (r.upper === k + 1) continue;
    const prefix = vs.slice(0, k), pre = exchangeRank(M, prefix), targetNorm = r.norms[k];
    const scaled = targetNorm && k ? M.lstsq(pre.A, vs[k].map(x => x / targetNorm), EXCHANGE_POLICY.dependent * (pre.singular[0] || 1)) : Array(k).fill(0);
    const c = scaled.map((x, i) => pre.norms[i] ? x * targetNorm / pre.norms[i] : 0);
    const chain = [[0, 0, 0]];
    for (let i = 0; i < k; i++) chain.push(chain.at(-1).map((x, j) => x + c[i] * prefix[i][j]));
    const residual = Math.hypot(...vs[k].map((x, j) => x - chain.at(-1)[j]));
    const relativeResidual = targetNorm ? residual / targetNorm : residual;
    if (![...c, ...chain.flat(), residual, relativeResidual].every(Number.isFinite) || relativeResidual > EXCHANGE_POLICY.residual) return { status: 'uncertain', k, rank: r, c, chain, residual, relativeResidual };
    return { status: 'dependent', k, rank: r, c, chain, residual, relativeResidual };
  }
  return { status: 'independent' };
}

export function exchangeTrace(M, W, U) {
  if (!validExchangeVectors(W, W?.length) || W.length > 5 || !validExchangeVectors(U, U?.length) || U.length > 4) throw new Error('Exchange lists need at most 5 w and 4 u vectors in the closed radius-2 ball of R^3.');
  const records = (a, kind) => a.map((p, i) => ({ id: kind + (i + 1), kind, i, p: p.slice() }));
  const w = records(W, 'w'), u = records(U, 'u'), wRank = exchangeRank(M, W), uPrefix = exchangePrefix(M, U);
  let B = w.slice(); const gone = [], frames = [];
  const push = (phase, extra = {}) => frames.push({ phase, B: B.slice(), gone: gone.slice(), ...extra });
  push('initial');
  if (wRank.ambiguous) push('uncertain', { reason: 'W' });
  else if (wRank.rank !== 3) push('nonspanning');
  else {
    for (let k = 0; k < U.length; k++) {
      B = [...B.filter(e => e.kind === 'u'), u[k], ...B.filter(e => e.kind === 'w')];
      push('insert', { ins: u[k], k });
      const dep = exchangePrefix(M, B.map(e => e.p));
      // A defensive stop, not a claim that an impossible exact proof step failed.
      if (dep.status !== 'dependent') { push('uncertain', { reason: 'relation', dep, k, ins: u[k] }); break; }
      const out = B[dep.k];
      if (out.kind === 'u') { push('dependentU', { ins: u[k], dep, out, k }); break; }
      push('relation', { ins: u[k], dep, out, k });
      B = B.filter(e => e !== out); gone.push(out);
      push('remove', { out, k });
      if (k === U.length - 1) push('done');
    }
    if (!U.length) push('done');
  }
  return { W: w, U: u, wRank, uPrefix, frames, policy: EXCHANGE_POLICY };
}
