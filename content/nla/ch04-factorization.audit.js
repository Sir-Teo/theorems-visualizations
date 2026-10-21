// Dedicated audited teaching implementation. Pivot rule: LAPACK DSYTF2 (lower branch).
export function auditedLDLT(A0, { pivoting = true } = {}) {
  const scale = Math.max(...A0.flat().map(Math.abs)) || 1;
  const n = A0.length, W = A0.map((r) => r.map(x => x / scale)), L = Array.from({ length: n }, () => new Array(n).fill(0)), perm = Array.from({ length: n }, (_, i) => i), blocks = [];
  const alpha = (1 + Math.sqrt(17)) / 8, swap = (a, b) => {
    if (a === b) return;
    [W[a], W[b]] = [W[b], W[a]]; for (const r of W) [r[a], r[b]] = [r[b], r[a]];
    [L[a], L[b]] = [L[b], L[a]]; [perm[a], perm[b]] = [perm[b], perm[a]];
  };
  let k = 0, breakdown = -1;
  while (k < n) {
    let size = 1;
    if (pivoting && k < n - 1) {
      let lam = 0, r = k;
      for (let i = k + 1; i < n; i++) if (Math.abs(W[i][k]) > lam) { lam = Math.abs(W[i][k]); r = i; }
      if (lam > 0 && Math.abs(W[k][k]) < alpha * lam) {
        let sigma = 0; for (let i = k; i < n; i++) if (i !== r) sigma = Math.max(sigma, Math.abs(W[i][r]));
        if (Math.abs(W[k][k]) * sigma >= alpha * lam * lam) size = 1;
        else if (Math.abs(W[r][r]) >= alpha * sigma) { swap(k, r); size = 1; }
        else { swap(k + 1, r); size = 2; }
      }
    }
    if (size === 1) {
      const d = W[k][k];
      if (d === 0) { if (!pivoting && breakdown < 0) breakdown = k; if (!pivoting) { for (const b of blocks) b.E = b.E.map(row => row.map(x => x * scale)); return { L, blocks, perm, twoByTwo: blocks.filter(b => b.size === 2).length, breakdown, n, scale }; } }
      blocks.push({ k, size: 1, E: [[d]] }); L[k][k] = 1;
      for (let i = k + 1; i < n; i++) L[i][k] = d === 0 ? 0 : W[i][k] / d;
      for (let i = k + 1; i < n; i++) for (let j = k + 1; j < n; j++) W[i][j] -= L[i][k] * d * L[j][k];
    } else {
      const E = [[W[k][k], W[k + 1][k]], [W[k + 1][k], W[k + 1][k + 1]]], det = E[0][0] * E[1][1] - E[0][1] * E[1][0], Ei = [[E[1][1] / det, -E[0][1] / det], [-E[1][0] / det, E[0][0] / det]];
      blocks.push({ k, size: 2, E }); L[k][k] = 1; L[k + 1][k + 1] = 1;
      for (let i = k + 2; i < n; i++) {
        const a = W[i][k], b = W[i][k + 1];
        L[i][k] = a * Ei[0][0] + b * Ei[1][0]; L[i][k + 1] = a * Ei[0][1] + b * Ei[1][1];
      }
      for (let i = k + 2; i < n; i++) for (let j = k + 2; j < n; j++) {
        const li = [L[i][k], L[i][k + 1]], lj = [L[j][k], L[j][k + 1]];
        W[i][j] -= li[0] * (E[0][0] * lj[0] + E[0][1] * lj[1]) + li[1] * (E[1][0] * lj[0] + E[1][1] * lj[1]);
      }
    }
    k += size;
  }
  for (const b of blocks) b.E = b.E.map(row => row.map(x => x * scale));
  return { L, blocks, perm, twoByTwo: blocks.filter((b) => b.size === 2).length, breakdown, n, scale };
}

/** Scale-relative numerical sign buckets; the middle bucket is uncertainty, not exact nullity. */
export function numericalInertia(values, n = values.length) {
  const tol = 64 * n * Number.EPSILON * Math.max(...values.map(Math.abs), 0);
  return { pos: values.filter(x => x > tol).length, neg: values.filter(x => x < -tol).length, zero: values.filter(x => Math.abs(x) <= tol).length, tol };
}
export function blockEigenvalues(f) {
  return f.blocks.flatMap(b => { if (b.size === 1) return [b.E[0][0]];
    const scale = Math.max(...b.E.flat().map(Math.abs)); if (!scale) return [0,0];
    const a=b.E[0][0]/scale,d=b.E[1][1]/scale,c=b.E[0][1]/scale,m=(a+d)/2,r=Math.hypot((a-d)/2,c);
    return [(m-r)*scale,(m+r)*scale]; });
}
