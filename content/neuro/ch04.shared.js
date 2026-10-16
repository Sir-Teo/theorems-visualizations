// Computational Neuroscience — Chapter 4: helpers shared by ch04.js and its part files
// (re-exports the chapter-3 helpers; adds a tridiagonal solver and a dimensionless passive-cable solver, the Green's function of the
//  passive cable, a tree-structured compartmental engine (Hines elimination, implicit voltage / exponential-Euler gates) with Hodgkin–Huxley
//  channels, builders for uniform axons, myelinated axons and a synthetic branching neuron, and conduction-velocity measurement)
export * from './ch03.shared.js';
import { HH, phiT } from './ch03.shared.js';

// ---------------------------------------------------------------- tridiagonal systems and the dimensionless passive cable
/** Solve a tridiagonal system (a below, b diagonal, c above, d right side) by the Thomas algorithm; returns a new array. */
export function thomas(a, b, c, d) {
  const n = b.length, cp = new Float64Array(n), dp = new Float64Array(n), x = new Float64Array(n);
  cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
  for (let i = 1; i < n; i++) { const m = b[i] - a[i] * cp[i - 1]; cp[i] = c[i] / m; dp[i] = (d[i] - a[i] * dp[i - 1]) / m; }
  x[n - 1] = dp[n - 1];
  for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
  return x;
}
/**
 * Dimensionless passive cable  ∂V/∂T = ∂²V/∂X² − V + source  on [x0, x1] (X in units of λ, T in units of τ) with N intervals.
 * End conditions 'sealed' (V' = 0, ghost-node reflection) or 'killed' (V = 0). Returns a grid {x, h}.
 */
export function cableGrid(x0, x1, N) {
  const h = (x1 - x0) / N, x = new Float64Array(N + 1);
  for (let i = 0; i <= N; i++) x[i] = x0 + i * h;
  return { x, h, N, x0, x1 };
}
/** Steady state of −V'' + V = q δ(X − xs) (unit charge flux q). bcL, bcR ∈ 'sealed' | 'killed'. */
export function cableSteady(g, xs, q, bcL = 'sealed', bcR = 'sealed') {
  const { N, h, x } = g, n = N + 1, a = new Float64Array(n), b = new Float64Array(n), c = new Float64Array(n), d = new Float64Array(n);
  const h2 = h * h;
  for (let i = 0; i < n; i++) { a[i] = -1 / h2; b[i] = 2 / h2 + 1; c[i] = -1 / h2; }
  if (bcL === 'sealed') { c[0] = -2 / h2; a[0] = 0; } else { b[0] = 1; c[0] = 0; a[0] = 0; }
  if (bcR === 'sealed') { a[n - 1] = -2 / h2; c[n - 1] = 0; } else { b[n - 1] = 1; a[n - 1] = 0; c[n - 1] = 0; }
  const f = (xs - x[0]) / h, i0 = Math.min(n - 2, Math.max(0, Math.floor(f))), w = Math.min(1, Math.max(0, f - i0));
  d[i0] += (q * (1 - w)) / h; d[i0 + 1] += (q * w) / h;
  if (bcL === 'sealed') d[0] *= 2; // a sealed end node is a half cell: its source density doubles
  if (bcR === 'sealed') d[n - 1] *= 2;
  if (bcL === 'killed') d[0] = 0;
  if (bcR === 'killed') d[n - 1] = 0;
  return thomas(a, b, c, d);
}
/**
 * Advance V(X, T) by nsteps of size dt: ∂V/∂T = κ V_XX − leak·V (κ = 1 normally, 0 turns diffusion off; leak = 1 or 0).
 * Crank–Nicolson, preceded by two half-size backward-Euler steps when `start` is true (damps the roughness of a δ initial state).
 */
export function cableEvolve(g, V, dt, nsteps, { bcL = 'sealed', bcR = 'sealed', leak = 1, start = false, src = null } = {}) {
  const { N, h } = g, n = N + 1, h2 = h * h;
  let cur = Float64Array.from(V);
  const step = (dtt, th) => {
    const a = new Float64Array(n), b = new Float64Array(n), c = new Float64Array(n), r = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const lo = i > 0 ? cur[i - 1] : cur[1], hi = i < N ? cur[i + 1] : cur[N - 1];
      const L = (lo - 2 * cur[i] + hi) / h2 - leak * cur[i];
      r[i] = cur[i] + (1 - th) * dtt * L + (src ? dtt * src[i] : 0);
      a[i] = -th * dtt / h2; c[i] = -th * dtt / h2; b[i] = 1 + th * dtt * (2 / h2 + leak);
    }
    if (bcL === 'sealed') { c[0] = -2 * th * dtt / h2; a[0] = 0; } else { b[0] = 1; c[0] = 0; a[0] = 0; r[0] = 0; }
    if (bcR === 'sealed') { a[n - 1] = -2 * th * dtt / h2; c[n - 1] = 0; } else { b[n - 1] = 1; a[n - 1] = 0; c[n - 1] = 0; r[n - 1] = 0; }
    cur = thomas(a, b, c, r);
  };
  let k = 0;
  if (start) { step(dt / 2, 1); step(dt / 2, 1); k = 1; }
  for (; k < nsteps; k++) step(dt, 0.5);
  return cur;
}
/** Green's function of the infinite passive cable (dimensionless): response to a unit charge δ(X)δ(T); leak = 0 gives the pure-diffusion Gaussian. */
export function greenCable(X, T, leak = 1) {
  if (T <= 0) return 0;
  return Math.exp(-leak * T - (X * X) / (4 * T)) / Math.sqrt(4 * Math.PI * T);
}
/** Time at which the Green's function peaks at distance X (dimensionless): T* = (√(1+4X²) − 1)/4. */
export const greenPeakTime = (X) => (Math.sqrt(1 + 4 * X * X) - 1) / 4;

// ---------------------------------------------------------------- electrical constants
/** Length constant λ (µm) of a cylinder of diameter d (µm): √(R_m d / (4 R_a)), R_m in Ω·cm², R_a in Ω·cm. */
export const lambdaUm = (d, Rm, Ra) => 1e4 * Math.sqrt((Rm * d * 1e-4) / (4 * Ra));
/** Semi-infinite-cable input conductance (µS): G∞ = (π/2) d^{3/2} / √(R_m R_a) with d in cm; this is the 3/2 power law. */
export const gInf = (d, Rm, Ra) => 1e6 * (Math.PI / 2) * Math.pow(d * 1e-4, 1.5) / Math.sqrt(Rm * Ra);

// ---------------------------------------------------------------- tree-structured compartmental engine
/**
 * Build a compartment tree from segments [{parent: index of an earlier segment or -1, len (µm), dia (µm), soma?: true, tag?}].
 * Each segment is cut into ceil(len/dxMax) equal compartments. Returns arrays per compartment:
 * par (parent index, −1 for the root), len, dia (µm), area (cm²), seg (segment index), pos (centre, µm from the segment start),
 * and coupling conductance gc[i] (µS) between i and its parent for axial resistivity Ra (Ω·cm).
 */
export function buildTree(segs, { dxMax = 20, Ra = 100 } = {}) {
  const par = [], len = [], dia = [], seg = [], pos = [], first = [], last = [];
  segs.forEach((s, k) => {
    const m = s.soma ? 1 : Math.max(1, Math.ceil(s.len / dxMax)), l = s.soma ? s.dia : s.len / m;
    first[k] = par.length;
    for (let j = 0; j < m; j++) {
      par.push(j === 0 ? (s.parent >= 0 ? last[s.parent] : -1) : par.length - 1);
      len.push(l); dia.push(s.dia); seg.push(k); pos.push((j + 0.5) * l);
    }
    last[k] = par.length - 1;
  });
  const n = par.length, area = new Float64Array(n), gc = new Float64Array(n);
  const R = (i) => (4 * Ra * (len[i] * 1e-4)) / (Math.PI * (dia[i] * 1e-4) ** 2); // Ω
  for (let i = 0; i < n; i++) {
    area[i] = Math.PI * (dia[i] * 1e-4) * (len[i] * 1e-4);
    gc[i] = par[i] >= 0 ? 1e6 / (R(i) / 2 + R(par[i]) / 2) : 0;
  }
  return { n, par: Int32Array.from(par), len, dia, seg, pos, area, gc, first, last, segs };
}
/** Solve the tree-structured system (diagonal d with + couplings, off-diagonals −gc, right side b) in place; V receives the solution. */
export function hinesSolve(par, gc, d, b, V) {
  const n = d.length;
  for (let i = n - 1; i > 0; i--) { const p = par[i], g = gc[i], f = g / d[i]; d[p] -= f * g; b[p] += f * b[i]; }
  V[0] = b[0] / d[0];
  for (let i = 1; i < n; i++) V[i] = (b[i] + gc[i] * V[par[i]]) / d[i];
}
/**
 * Steady state of a passive tree with injected currents I (nA per compartment), leak conductance gL (mS/cm²) (number or array)
 * relative to the leak reversal (so V is the deviation from rest). Returns Float64Array (mV).
 */
export function treeSteady(tr, I, gL) {
  const n = tr.n, d = new Float64Array(n), b = new Float64Array(n), V = new Float64Array(n), g = arr(gL, n);
  for (let i = 0; i < n; i++) { d[i] = g[i] * tr.area[i] * 1e3; b[i] = I[i]; }
  for (let i = 1; i < n; i++) { d[i] += tr.gc[i]; d[tr.par[i]] += tr.gc[i]; }
  hinesSolve(tr.par, tr.gc, d, b, V);
  return V;
}
function arr(x, n) { return typeof x === 'number' ? new Float64Array(n).fill(x) : Float64Array.from(x); }
const _unused = (x, n) => (typeof x === 'number' ? new Float64Array(n).fill(x) : Float64Array.from(x));
/**
 * Time-stepping engine for a compartment tree with leak, optional Hodgkin–Huxley Na/K channels and conductance synapses.
 * Voltage is advanced implicitly (conductances frozen at the old gate values), the gates by exponential Euler with the new voltage.
 * prm: dt (ms), tEnd, cm (µF/cm², number|array), gL (mS/cm²), gNa, gK (mS/cm², number|array, default 0), V0 (mV, −65), T (°C, 6.3),
 *      EL (leak reversal; default chosen so V0 is an equilibrium), ENa, EK,
 *      stim(t, I) adds injected current (nA) to the array I, syn: [{node, gmax (µS), t0, tau (ms), E (mV)}] (alpha conductances) or {nmda: true, tauR, tauD, mg (mM)} (peak conductance gmax, Mg-blocked),
 *      rec: node indices to record, every: record every k steps, stopWhen(t, V) → true to end early.
 * Returns {t, V: [Float32Array per recorded node], frames?} (frames: full-V snapshots when prm.frames = step count).
 */
export function treeSim(tr, prm) {
  const n = tr.n, dt = prm.dt ?? 0.025, tEnd = prm.tEnd, V0 = prm.V0 ?? -65, phi = phiT(prm.T ?? 6.3);
  const cm = arr(prm.cm ?? 1, n), gL = arr(prm.gL, n), gNa = arr(prm.gNa ?? 0, n), gK = arr(prm.gK ?? 0, n);
  const ENa = prm.ENa ?? 50, EK = prm.EK ?? -77;
  const m = new Float64Array(n), h = new Float64Array(n), q = new Float64Array(n), V = new Float64Array(n).fill(V0);
  const am = HH.am(V0), bm = HH.bm(V0), ah = HH.ah(V0), bh = HH.bh(V0), an = HH.an(V0), bn = HH.bn(V0);
  m.fill(am / (am + bm)); h.fill(ah / (ah + bh)); q.fill(an / (an + bn));
  const EL = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const iion = gNa[i] * m[i] ** 3 * h[i] * (V0 - ENa) + gK[i] * q[i] ** 4 * (V0 - EK);
    EL[i] = prm.EL != null ? (typeof prm.EL === 'number' ? prm.EL : prm.EL[i]) : V0 + iion / gL[i];
  }
  const C = new Float64Array(n), S = new Float64Array(n), dco = new Float64Array(n);
  for (let i = 0; i < n; i++) { S[i] = tr.area[i] * 1e3; C[i] = cm[i] * S[i]; }
  for (let i = 1; i < n; i++) { dco[i] += tr.gc[i]; dco[tr.par[i]] += tr.gc[i]; }
  const d = new Float64Array(n), b = new Float64Array(n), Inj = new Float64Array(n), Vn = new Float64Array(n);
  const rec = prm.rec || [], out = { t: [], V: rec.map(() => []) }, every = prm.every ?? 1, syn = prm.syn || [];
  if (prm.frames) { out.frames = []; out.ft = []; }
  const N = Math.round(tEnd / dt);
  for (let k = 0; k <= N; k++) {
    const t = k * dt;
    if (k % every === 0) { out.t.push(t); rec.forEach((r, j) => out.V[j].push(V[r])); }
    if (prm.frames && k % prm.frames === 0) { out.frames.push(Float32Array.from(V)); out.ft.push(t); }
    if (prm.stopWhen && prm.stopWhen(t, V)) break;
    if (k === N) break;
    Inj.fill(0);
    if (prm.stim) prm.stim(t + dt, Inj);
    for (let i = 0; i < n; i++) {
      const gn = gNa[i] * S[i] * m[i] * m[i] * m[i] * h[i], gk = gK[i] * S[i] * q[i] * q[i] * q[i] * q[i], gl = gL[i] * S[i];
      d[i] = C[i] / dt + gl + gn + gk + dco[i];
      b[i] = (C[i] / dt) * V[i] + gl * EL[i] + gn * ENa + gk * EK + Inj[i];
    }
    for (const s of syn) {
      const x = t + dt - s.t0;
      if (x <= 0) continue;
      let g;
      if (s.nmda) { // two-exponential NMDA conductance with the Jahr–Stevens magnesium block B(V) = 1/(1 + [Mg]/3.57 · e^{−0.062 V})
        const k = s.tauD / s.tauR, tp = (s.tauD * s.tauR * Math.log(k)) / (s.tauD - s.tauR), nrm = Math.exp(-tp / s.tauD) - Math.exp(-tp / s.tauR);
        g = (s.gmax * (Math.exp(-x / s.tauD) - Math.exp(-x / s.tauR))) / nrm / (1 + ((s.mg ?? 1) / 3.57) * Math.exp(-0.062 * V[s.node]));
      } else { const u = x / s.tau; g = s.gmax * u * Math.exp(1 - u); }
      d[s.node] += g; b[s.node] += g * (s.E ?? 0);
    }
    hinesSolve(tr.par, tr.gc, d, b, Vn);
    for (let i = 0; i < n; i++) {
      V[i] = Vn[i];
      if (gNa[i] > 0 || gK[i] > 0) {
        const v = Vn[i], a1 = HH.am(v), b1 = HH.bm(v), a2 = HH.ah(v), b2 = HH.bh(v), a3 = HH.an(v), b3 = HH.bn(v);
        let r = phi * (a1 + b1), inf = a1 / (a1 + b1); m[i] = inf + (m[i] - inf) * Math.exp(-dt * r);
        r = phi * (a2 + b2); inf = a2 / (a2 + b2); h[i] = inf + (h[i] - inf) * Math.exp(-dt * r);
        r = phi * (a3 + b3); inf = a3 / (a3 + b3); q[i] = inf + (q[i] - inf) * Math.exp(-dt * r);
      }
    }
  }
  out.Vend = V;
  return out;
}

// ---------------------------------------------------------------- uniform and myelinated axons
/** Uniform unmyelinated axon of diameter d (µm), HH channels at squid densities, T °C: arrival times at x1, x2 (cm) and the speed in m/s. */
export function unmyelinatedSpeed(d, { T = 18.5, Ra = 35.4, dx = 100, N = 300, x1 = 1, x2 = 2.4, frames = 0, tEnd = 60, p = HH } = {}) {
  const segs = [{ parent: -1, len: N * dx, dia: d }], tr = buildTree(segs, { dxMax: dx, Ra });
  const i1 = Math.round((x1 * 1e4) / dx), i2 = Math.round((x2 * 1e4) / dx);
  let t1 = null, t2 = null;
  const stim = (t, I) => { if (t < 0.5) for (let i = 0; i < 10; i++) I[i] = 500 * tr.area[i] * 1e3; };
  const r = treeSim(tr, {
    dt: 0.02, tEnd, cm: 1, gL: p.gL, gNa: p.gNa, gK: p.gK, ENa: p.ENa, EK: p.EK, T, stim, rec: [i1, i2], frames,
    stopWhen: (t, V) => { if (t1 == null && V[i1] > 0) t1 = t; if (t2 == null && V[i2] > 0) t2 = t; return !frames && t2 != null; },
  });
  const speed = t1 != null && t2 != null ? ((x2 - x1) * 1e-2) / ((t2 - t1) * 1e-3) : NaN; // m/s
  return { speed, t1, t2, sim: r, tr, dx, i1, i2 };
}
/**
 * Myelinated axon: nNodes nodes of Ranvier (1 µm, HH channels) separated by internodes of length ratio·D, each cut into mInt compartments.
 * The axon (inner) diameter is g·D; the sheath is nb membrane bilayers in series, so the internodal capacitance and leak are divided by nb.
 */
export function buildMyelinated(D, { g = 0.65, ratio = 100, nNodes = 12, mInt = 3, Ra = 35.4, nodeLen = 1, bilayerNm = 8.5, nbOverride = null } = {}) {
  const d = g * D, sheath = (D - d) / 2, nb = nbOverride ?? Math.max(1, Math.round((sheath * 1e3) / bilayerNm)), L = ratio * D;
  const segs = []; const kind = [];
  for (let k = 0; k < nNodes; k++) {
    segs.push({ parent: k === 0 ? -1 : segs.length - 1, len: nodeLen, dia: d }); kind.push('node');
    if (k < nNodes - 1) { segs.push({ parent: segs.length - 1, len: L, dia: d }); kind.push('int'); }
  }
  const tr = buildTree(segs, { dxMax: L / mInt + 1e-9, Ra });
  const isNode = new Array(tr.n);
  for (let i = 0; i < tr.n; i++) isNode[i] = kind[tr.seg[i]] === 'node';
  return { tr, isNode, nb, d, L, D, kind };
}
/** Speed (m/s) of the impulse on a myelinated axon between nodes 3 and nNodes−3 (index), plus the simulation. */
export function myelinatedSpeed(D, opt = {}) {
  const { T = 18.5, p = HH, nodeFac = 30 } = opt, M = buildMyelinated(D, opt), { tr, isNode, nb } = M;
  const n = tr.n, nodeIdx = []; for (let i = 0; i < n; i++) if (isNode[i]) nodeIdx.push(i);
  const cm = new Float64Array(n), gL = new Float64Array(n), gNa = new Float64Array(n), gK = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    if (isNode[i]) { cm[i] = 1; gL[i] = p.gL; gNa[i] = p.gNa * nodeFac; gK[i] = p.gK * nodeFac; } else { cm[i] = 1 / nb; gL[i] = p.gL / nb; }
  }
  const ka = 3, kb = nodeIdx.length - 3, ia = nodeIdx[ka], ib = nodeIdx[kb];
  let ta = null, tb = null;
  const stim = (t, I) => { if (t < 0.3) I[nodeIdx[0]] = 4000 * (tr.area[nodeIdx[0]] + (tr.area[nodeIdx[0] + 1] * 3) / nb) * 1e3; };
  const r = treeSim(tr, {
    dt: opt.dt ?? 0.005, tEnd: opt.tEnd ?? 8, cm, gL, gNa, gK, ENa: p.ENa, EK: p.EK, T, stim, rec: nodeIdx, frames: opt.frames || 0, every: 2,
    stopWhen: (t, V) => { if (ta == null && V[ia] > 0) ta = t; if (tb == null && V[ib] > 0) tb = t; return tb != null && !opt.frames; },
  });
  let x = 0; const xs = []; // distance of every compartment from the start (µm)
  for (let i = 0; i < n; i++) { x += i === 0 ? 0 : (tr.len[i] + tr.len[i - 1]) / 2; xs.push(x); }
  const speed = ta != null && tb != null ? ((xs[ib] - xs[ia]) * 1e-6) / ((tb - ta) * 1e-3) : NaN;
  return { speed, sim: r, M, nodeIdx, xs, ta, tb };
}

// ---------------------------------------------------------------- a synthetic branching neuron (a model, not a reconstruction)
/**
 * Deterministic synthetic dendritic tree: a soma (20 µm) with nPrim primary dendrites that branch up to `depth` times.
 * Daughter diameters obey d_p^{3/2} = d_1^{3/2} + d_2^{3/2} with a random split. Segments carry 2-D end points (µm) for drawing.
 */
export function syntheticNeuron(seed = 5, { nPrim = 4, depth = 3, d0 = 3.2 } = {}) {
  let s = seed >>> 0; const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  const segs = [{ parent: -1, len: 20, dia: 20, soma: true, x0: 0, y0: 0, x1: 0, y1: 0, ang: 0 }];
  const grow = (parent, x, y, ang, dia, lev) => {
    const len = (60 + 70 * rnd()) * (lev === 0 ? 1.2 : 1), a = ang + (rnd() - 0.5) * 0.35, x1 = x + len * Math.cos(a), y1 = y + len * Math.sin(a);
    const k = segs.length; segs.push({ parent, len, dia, x0: x, y0: y, x1, y1, lev });
    if (lev < depth) {
      const f = 0.3 + 0.4 * rnd(), da = dia ** 1.5, d1 = Math.pow(da * f, 2 / 3), d2 = Math.pow(da * (1 - f), 2 / 3), sp = 0.45 + 0.35 * rnd();
      grow(k, x1, y1, a + sp, Math.max(0.5, d1), lev + 1); grow(k, x1, y1, a - sp, Math.max(0.5, d2), lev + 1);
    }
  };
  for (let j = 0; j < nPrim; j++) {
    const a = (2 * Math.PI * (j + 0.15 + 0.2 * rnd())) / nPrim;
    grow(0, 10 * Math.cos(a), 10 * Math.sin(a), a, d0 * (0.8 + 0.4 * rnd()), 0);
  }
  return segs;
}
