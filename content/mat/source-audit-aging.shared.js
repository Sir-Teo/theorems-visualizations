// Synthetic fixed-fraction precipitation model; SI moduli, nm radii, hours, MPa stresses.
export const AGING = Object.freeze({ G: 26e9, b: 0.286e-9, M: 3.06, matrix: 60, r0: 1.2, tref: 463.15, kB: 8.617333262145e-5 });
export function spacingFactor(f) { if (!(f > 0 && f < Math.PI / 6)) throw new RangeError('positive, nonoverlapping array required'); return Math.sqrt(2 * Math.PI / (3 * f)) - 2; }
export function orowan(r, f) { if (!(r > 0)) throw new RangeError('radius must be positive'); return AGING.M * AGING.G * AGING.b / (r * spacingFactor(f) * 1e-9) / 1e6; }
export function shearCoefficient(rc) { if (!(rc > 0)) throw new RangeError('reference crossover must be positive'); return orowan(rc, .03) / Math.sqrt(rc * .03); }
export function shearing(r, f, rc) { return shearCoefficient(rc) * Math.sqrt(r * f); }
export function coarseningRate(TC, Q) { return (6 ** 3 - AGING.r0 ** 3) / 10 * Math.exp(-Q / AGING.kB * (1 / (TC + 273.15) - 1 / AGING.tref)); }
export function radiusAt(t, TC, Q) { if (!(t >= 0)) throw new RangeError('time must be nonnegative'); return Math.cbrt(AGING.r0 ** 3 + coarseningRate(TC, Q) * t); }
export function agingPoint(t, f, TC, Q, rc) { const r = radiusAt(t, TC, Q), sh = shearing(r, f, rc), orr = orowan(r, f); return { r, sh, orr, s: AGING.matrix + Math.min(sh, orr) }; }
// A sqrt(r f) = B(f)/r, so r_cross = (B/[A sqrt(f)])^(2/3).
export function agingPeak(f, TC, Q, rc, lo = .01, hi = 1e4) {
 const r = (orowan(1, f) / (shearCoefficient(rc) * Math.sqrt(f))) ** (2 / 3);
 const t = (r ** 3 - AGING.r0 ** 3) / coarseningRate(TC, Q);
 const inWindow = t >= lo && t <= hi;
 const visibleTime = Math.max(lo, Math.min(hi, t));
 return { r, t, inWindow, position: t < lo ? 'before' : t > hi ? 'after' : 'inside', visibleTime, visible: agingPoint(visibleTime, f, TC, Q, rc), crossoverStrength: AGING.matrix + orowan(r, f) };
}

// Periodic, eight-neighbor, zero-lattice-temperature neighbor-copy variant.
const NBX = [-1, 0, 1, -1, 1, -1, 0, 1], NBY = [-1, -1, -1, 0, 0, 1, 1, 1];
export function mcInit(N, nuc, seed, v) {
  const r = v.rng(seed), o = new Int32Array(N * N), f = new Uint8Array(N * N), nGr = 52, sx = [], sy = [];
  for (let k = 0; k < nGr; k++) { sx.push(r() * N); sy.push(r() * N); }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let b = 1e9, bi = 0;
    for (let k = 0; k < nGr; k++) { let dx = Math.abs(x - sx[k]); dx = Math.min(dx, N - dx); let dy = Math.abs(y - sy[k]); dy = Math.min(dy, N - dy); const d = (dx / 1.7) ** 2 + (dy * 1.7) ** 2; if (d < b) { b = d; bi = k; } }
    o[y * N + x] = bi + 1; f[y * N + x] = 1;
  }
  let id = nGr + 1;
  for (let k = 0; k < nuc; k++) {
    const cx = Math.floor(r() * N), cy = Math.floor(r() * N);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (Math.abs(dx) + Math.abs(dy) > 1) continue; const i = ((cy + dy + N) % N) * N + ((cx + dx + N) % N); o[i] = id; f[i] = 0; }
    id++;
  }
  const S = { N, o, f, r, t: 0, hist: [] }; S.hist.push({ t: 0, ...mcStats(S) }); return S;
}
export function mcSweep(S, Es) {
  const { N, o, f, r } = S, NN = N * N;
  for (let n = 0; n < NN; n++) {
    const i = Math.floor(r() * NN), x = i % N, y = (i - x) / N, k = Math.floor(r() * 8);
    const j = ((y + NBY[k] + N) % N) * N + ((x + NBX[k] + N) % N);
    if (o[j] === o[i]) continue;
    mcTry(S, i, k, Es);
  }
  S.t++;
  if (S.t % 4 === 0) S.hist.push({ t: S.t, ...mcStats(S) });
}
export function mcStats(S) {
  const { N, o, f } = S; let fd = 0; for (let i = 0; i < N * N; i++) fd += f[i];
  const seen = new Uint8Array(N * N), st = []; let ng = 0;
  for (let i = 0; i < N * N; i++) {
    if (seen[i]) continue; ng++; seen[i] = 1; st.push(i);
    while (st.length) { const p = st.pop(), x = p % N, y = (p - x) / N; for (let q = 0; q < 8; q++) { const nx = (x + NBX[q] + N) % N, ny = (y + NBY[q] + N) % N, w = ny * N + nx; if (!seen[w] && o[w] === o[p]) { seen[w] = 1; st.push(w); } } }
  }
  return { fdef: fd / (N * N), ng };
}

// Copy one neighboring orientation and its stored-energy state. The change is for
// the Hamiltonian with each undirected pair counted ONCE (not twice).
export function mcTry(S, i, k, Es) {
 const { N, o, f } = S, x = i % N, y = Math.floor(i / N);
 const j = ((y + NBY[k] + N) % N) * N + ((x + NBX[k] + N) % N);
 if (o[j] === o[i]) return { accepted: false, delta: 0 };
 let before = 0, after = 0; const oi = o[i], oj = o[j];
 for (let q = 0; q < 8; q++) { const val = o[((y + NBY[q] + N) % N) * N + ((x + NBX[q] + N) % N)]; before += +(val !== oi); after += +(val !== oj); }
 const delta = after - before + Es * (f[j] - f[i]), accepted = delta <= 0;
 if (accepted) { o[i] = oj; f[i] = f[j]; }
 return { accepted, delta };
}
export function recoveryFactor(t, enabled) { return enabled ? .4 + .6 * Math.exp(-t / 40) : 1; }
