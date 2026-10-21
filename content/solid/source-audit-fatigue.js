// Mathematical idealisations checked against COMSOL Fatigue Module 6.3,
// Stress Life Models, Cumulative Damage Model and Mean Stress Correction.
// The chapter supplies chosen material-like parameters, not fitted test data.
export function fatigueSlope(m) {
  return Math.log(m.Se / (.9 * m.Su)) / Math.log(m.Nk / 1000);
}
export function fatigueStress(m, N) {
  if (N < 1000) return null; // no low-cycle extrapolation
  return m.limit && N >= m.Nk ? m.Se : .9 * m.Su * (N / 1000) ** fatigueSlope(m);
}
export function fatigueLife(m, S) {
  if (S > .9 * m.Su) return {kind:'outside', N:null};
  if (S <= 0 || (m.limit && S <= m.Se)) return {kind:'plateau', N:Infinity};
  return {kind:'finite', N:1000 * (S / (.9 * m.Su)) ** (1 / fatigueSlope(m))};
}
export function fatigueBatch(m, S, normalSamples, stop) {
  const life = fatigueLife(m, S);
  const specimens = life.kind === 'outside' ? [] : normalSamples.map(z => {
    const latent = life.kind === 'finite' ? life.N * 10 ** (.25 * z) : Infinity;
    return {N:Math.min(latent, stop), censored:latent > stop};
  });
  return {...life, stop, specimens};
}

// Exactly the same two blocks are permuted. The planned history may extend
// beyond D=1 to show the accounting; crossing is the first Miner threshold.
export function minerBlocks(NA, NB, share, usage) {
  const nA = NA * share * usage, nB = NB * (1 - share) * usage;
  const build = order => {
    const points = [[0,0]], blocks = [];
    let n = 0, D = 0, crossing = null;
    for (const key of order) {
      const count = key === 'A' ? nA : nB, life = key === 'A' ? NA : NB;
      const increment = count / life;
      if (crossing === null && D < 1 && D + increment >= 1) crossing = n + (1 - D) * life;
      blocks.push({key, count, increment, start:n, before:D});
      n += count; D += increment; points.push([n,D]);
    }
    return {blocks, points, total:n, damage:D, crossing};
  };
  return {nA,nB,ab:build(['A','B']),ba:build(['B','A'])};
}

export function meanStressBoundary(m, mean, kind = 'goodman') {
  // No credit for compressive mean stress is a chosen extension of the
  // tensile-mean interaction, not an assertion about measured behaviour.
  const positive = Math.max(0, mean);
  if (kind === 'gerber') return m.Se * Math.max(0, 1 - (positive / m.Su) ** 2);
  return m.Se * Math.max(0, 1 - positive / (kind === 'soderberg' ? m.Sy : m.Su));
}
export function meanStressState(m, mean, amplitude) {
  const a = amplitude / m.Se, g = Math.max(0, mean) / m.Su;
  const goodman = a + g > 0 ? 1 / (a + g) : Infinity;
  const s = Math.max(0, mean) / m.Sy;
  const soderberg = a + s > 0 ? 1 / (a + s) : Infinity;
  // Positive root of g^2 n^2 + a n = 1, rationalised to avoid cancellation.
  const gerber = a + g > 0 ? 2 / (a + Math.sqrt(a * a + 4 * g * g)) : Infinity;
  const maximum = mean + amplitude, minimum = mean - amplitude;
  const peak = Math.max(Math.abs(maximum), Math.abs(minimum));
  const yieldFactor = peak > 0 ? m.Sy / peak : Infinity;
  return {mean,amplitude,maximum,minimum,goodman,gerber,soderberg,yieldFactor,
    admitted:Math.min(goodman,yieldFactor) >= 1};
}
