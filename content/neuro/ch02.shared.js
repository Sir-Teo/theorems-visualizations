// Computational Neuroscience — Chapter 2: helpers shared by the Hodgkin–Huxley items
// (re-exports the chapter-1 helpers; adds an integrator for the space-clamped HH membrane, spike detection,
//  voltage-clamp gate kinetics, the Connor–Stevens model and a lumped Markov-channel simulation)
export * from './ch01.shared.js';
import { HH, gateRates, gateInf } from './ch01.shared.js';

// ---------------------------------------------------------------- Hodgkin–Huxley membrane (squid axon, rest −65 mV)
/** Temperature factor of the rate constants, 3^((T − 6.3)/10) (Hodgkin & Huxley 1952). */
export const phiT = (T) => Math.pow(3, (T - 6.3) / 10);
/** Resting state [V, m, h, n] at V = −65 mV (the leak reversal −54.387 mV makes this an equilibrium). */
export const hhRest = () => [-65, gateInf('m', -65), gateInf('h', -65), gateInf('n', -65)];
export function hhDeriv(y, I, phi, p = HH) {
  const [V, m, h, n] = y;
  const iNa = p.gNa * m ** 3 * h * (V - p.ENa), iK = p.gK * n ** 4 * (V - p.EK), iL = p.gL * (V - p.EL);
  const am = HH.am(V), bm = HH.bm(V), ah = HH.ah(V), bh = HH.bh(V), an = HH.an(V), bn = HH.bn(V);
  const fz = p.freeze || '';
  return [(I - iNa - iK - iL) / p.C, phi * (am * (1 - m) - bm * m), fz.includes('h') ? 0 : phi * (ah * (1 - h) - bh * h), fz.includes('n') ? 0 : phi * (an * (1 - n) - bn * n)];
}
/** One RK4 step in place; I is the injected current density (µA/cm²) held constant over the step. */
export function hhStep(y, I0, I1, dt, phi, p) {
  const Im = 0.5 * (I0 + I1);
  const k1 = hhDeriv(y, I0, phi, p);
  const k2 = hhDeriv(y.map((x, i) => x + 0.5 * dt * k1[i]), Im, phi, p);
  const k3 = hhDeriv(y.map((x, i) => x + 0.5 * dt * k2[i]), Im, phi, p);
  const k4 = hhDeriv(y.map((x, i) => x + dt * k3[i]), I1, phi, p);
  for (let i = 0; i < 4; i++) y[i] += (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
}
/**
 * Integrate the HH membrane under the current waveform Ifn(t) (µA/cm²). Returns samples every `every` steps:
 * t, V, m, h, n, and the currents INa, IK, IL (µA/cm², outward positive).
 */
export function hhSim(Ifn, { T = 6.3, tEnd = 30, dt = 0.02, every = 1, y0, p = HH } = {}) {
  const phi = phiT(T), y = (y0 || hhRest()).slice(), N = Math.round(tEnd / dt);
  const o = { t: [], V: [], m: [], h: [], n: [], INa: [], IK: [], IL: [], I: [] };
  for (let k = 0; k <= N; k++) {
    const t = k * dt;
    if (k % every === 0) {
      const [V, m, h, n] = y;
      o.t.push(t); o.V.push(V); o.m.push(m); o.h.push(h); o.n.push(n); o.I.push(Ifn(t));
      o.INa.push(p.gNa * m ** 3 * h * (V - p.ENa)); o.IK.push(p.gK * n ** 4 * (V - p.EK)); o.IL.push(p.gL * (V - p.EL));
    }
    if (k < N) hhStep(y, Ifn(t), Ifn(t + dt), dt, phi, p);
  }
  o.y = y;
  return o;
}

/**
 * Fast integration without recording (preallocated RK4, same scheme as hhSim): returns {spikes, peak, trough, y}. Use it for sweeps
 * and bisections; Ifn(t) is the current waveform (µA/cm²), p may carry freeze: 'h' | 'n' | 'hn'.
 */
export function hhRun(Ifn, { T = 6.3, tEnd = 30, dt = 0.04, y0, p = HH, thr = 0 } = {}) {
  const phi = phiT(T), fz = p.freeze || '', fh = fz.includes('h'), fn = fz.includes('n');
  const y = Float64Array.from(y0 || hhRest()), a = new Float64Array(4), k1 = new Float64Array(4), k2 = new Float64Array(4), k3 = new Float64Array(4), k4 = new Float64Array(4);
  const f = (s, I, o) => {
    const V = s[0], m = s[1], h = s[2], n = s[3];
    o[0] = (I - p.gNa * m * m * m * h * (V - p.ENa) - p.gK * n * n * n * n * (V - p.EK) - p.gL * (V - p.EL)) / p.C;
    o[1] = phi * (HH.am(V) * (1 - m) - HH.bm(V) * m);
    o[2] = fh ? 0 : phi * (HH.ah(V) * (1 - h) - HH.bh(V) * h);
    o[3] = fn ? 0 : phi * (HH.an(V) * (1 - n) - HH.bn(V) * n);
  };
  const N = Math.round(tEnd / dt), spikes = [];
  let armed = true, peak = -Infinity, trough = Infinity, Vp = y[0];
  for (let k = 0; k < N; k++) {
    const t = k * dt, I0 = Ifn(t), I1 = Ifn(t + dt), Im = 0.5 * (I0 + I1);
    f(y, I0, k1);
    for (let i = 0; i < 4; i++) a[i] = y[i] + 0.5 * dt * k1[i]; f(a, Im, k2);
    for (let i = 0; i < 4; i++) a[i] = y[i] + 0.5 * dt * k2[i]; f(a, Im, k3);
    for (let i = 0; i < 4; i++) a[i] = y[i] + dt * k3[i]; f(a, I1, k4);
    for (let i = 0; i < 4; i++) y[i] += (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    const V = y[0];
    if (armed && Vp < thr && V >= thr) { spikes.push(t + dt * ((thr - Vp) / (V - Vp))); armed = false; }
    if (V < thr - 20) armed = true;
    if (V > peak) peak = V; if (V < trough) trough = V;
    Vp = V;
  }
  return { spikes, peak, trough, y: Array.from(y) };
}
/** Upward crossings of `thr` (linear interpolation), re-armed once V falls below thr − 20 mV. */
export function spikeTimes(ts, Vs, thr = 0) {
  const out = []; let armed = true;
  for (let i = 1; i < ts.length; i++) {
    if (armed && Vs[i - 1] < thr && Vs[i] >= thr) { out.push(ts[i - 1] + ((thr - Vs[i - 1]) / (Vs[i] - Vs[i - 1])) * (ts[i] - ts[i - 1])); armed = false; }
    if (Vs[i] < thr - 20) armed = true;
  }
  return out;
}
/** Rectangular current pulse of amplitude a on [t0, t0 + d). */
export const pulse = (t0, d, a) => (t) => (t >= t0 && t < t0 + d ? a : 0);

// ---------------------------------------------------------------- gate kinetics under a voltage step (voltage clamp)
/** Gate value after holding V for time t starting from x0 (exact solution of dx/dt = α(1−x) − βx, rates ×phi). */
export function gateAt(g, x0, V, t, phi = 1) {
  const [a, b] = gateRates(g, V), s = phi * (a + b), inf = a / (a + b);
  return inf + (x0 - inf) * Math.exp(-s * t);
}
/**
 * Clamp record: hold at Vh until t0, step to V until t1, back to Vh. Returns arrays t, n, m, h at spacing dt.
 * (gates integrated exactly piece by piece; a clamp holds V constant so the rates are constants on each piece.)
 */
export function clampGates(V, { Vh = -65, t0 = 1, t1 = 11, tEnd = 18, dt = 0.05, phi = 1 } = {}) {
  const o = { t: [], n: [], m: [], h: [] };
  const st = { n: gateInf('n', Vh), m: gateInf('m', Vh), h: gateInf('h', Vh) };
  const cur = { n: st.n, m: st.m, h: st.h };
  
  const N = Math.round(tEnd / dt);
  for (let k = 0; k <= N; k++) {
    const t = k * dt, Vnew = t >= t0 && t < t1 ? V : Vh;
    for (const g of ['n', 'm', 'h']) cur[g] = gateAt(g, cur[g], Vnew, dt * (k ? 1 : 0), phi);
    o.t.push(t); o.n.push(cur.n); o.m.push(cur.m); o.h.push(cur.h);
  }
  return o;
}

// ---------------------------------------------------------------- Connor–Stevens (A-current) model
// Parameter set and kinetics as in the XPP file of the Pitt computational-neuroscience course (Hodgkin–Huxley kinetics with
// shifted voltage dependence and rate factor 3.8, plus the transient K⁺ A-current), after Connor & Stevens (1971) and
// Connor, Walter & McKown (1977). Voltages in the file's own convention (rest near −68 mV).
export const CS = { C: 1, gNa: 120, gK: 20, gA: 47.7, gL: 0.3, ENa: 55, EK: -72, EA: -75, EL: -17, q: 3.8 };
/** Leak reversal that keeps the resting potential at the gA = 47.7 value when the A-conductance is changed (an assumption of this page). */
export function csEL(gA) {
  const V = csRest47()[0];
  const m = csInf('m', V), h = csInf('h', V), n = csInf('n', V), a = csA.ainf(V), b = csA.binf(V);
  return V + (CS.gNa * m ** 3 * h * (V - CS.ENa) + CS.gK * n ** 4 * (V - CS.EK) + gA * a ** 3 * b * (V - CS.EA)) / CS.gL;
}
const vt = (x, y) => (Math.abs(x / y) < 1e-7 ? y * (1 - x / y / 2) : x / (Math.exp(x / y) - 1));
export const csRates = {
  m: (V) => [0.1 * vt(-(V + 35 - 5.3), 10), 4 * Math.exp(-(V + 60 - 5.3) / 18)],
  h: (V) => [0.07 * Math.exp(-(V + 60 - 12) / 20), 1 / (1 + Math.exp(-(V + 30 - 12) / 10))],
  n: (V) => [0.01 * vt(-(V + 50 - 4.3), 10), 0.125 * Math.exp(-(V + 60 - 4.3) / 80)],
};
export const csA = {
  ainf: (V) => Math.cbrt((0.0761 * Math.exp((V + 94.22) / 31.84)) / (1 + Math.exp((V + 1.17) / 28.93))),
  taua: (V) => 0.3632 + 1.158 / (1 + Math.exp((V + 55.96) / 20.12)),
  binf: (V) => 1 / (1 + Math.exp((V + 53.3) / 14.54)) ** 4,
  taub: (V) => 1.24 + 2.678 / (1 + Math.exp((V + 50) / 16.027)),
};
const csTau = (g, V) => { const [a, b] = csRates[g](V); return (g === 'n' ? 2 : 1) / (CS.q * (a + b)); };
const csInf = (g, V) => { const [a, b] = csRates[g](V); return a / (a + b); };
/** State [V, m, h, n, a, b]; gA overrides the A-current conductance (0 removes it). */
function csRest47() {
  let V = -68;
  for (let i = 0; i < 400; i++) {
    const m = csInf('m', V), h = csInf('h', V), n = csInf('n', V), a = csA.ainf(V), b = csA.binf(V);
    V += 0.05 * (-CS.gL * (V - CS.EL) - CS.gNa * m ** 3 * h * (V - CS.ENa) - CS.gK * n ** 4 * (V - CS.EK) - CS.gA * a ** 3 * b * (V - CS.EA));
  }
  return [V];
}
export function csRest(gA = CS.gA) {
  const EL = csEL(gA);
  let V = -68;
  for (let i = 0; i < 200; i++) {
    const m = csInf('m', V), h = csInf('h', V), n = csInf('n', V), a = csA.ainf(V), b = csA.binf(V);
    const f = -CS.gL * (V - EL) - CS.gNa * m ** 3 * h * (V - CS.ENa) - CS.gK * n ** 4 * (V - CS.EK) - gA * a ** 3 * b * (V - CS.EA);
    V += 0.05 * f;
  }
  return [V, csInf('m', V), csInf('h', V), csInf('n', V), csA.ainf(V), csA.binf(V)];
}
function csDeriv(y, I, gA, EL) {
  const [V, m, h, n, a, b] = y;
  return [
    -CS.gL * (V - EL) - CS.gNa * m ** 3 * h * (V - CS.ENa) - CS.gK * n ** 4 * (V - CS.EK) - gA * a ** 3 * b * (V - CS.EA) + I,
    (csInf('m', V) - m) / csTau('m', V), (csInf('h', V) - h) / csTau('h', V), (csInf('n', V) - n) / csTau('n', V),
    (csA.ainf(V) - a) / csA.taua(V), (csA.binf(V) - b) / csA.taub(V),
  ];
}
export function csStep(y, I, dt, gA, EL) {
  const k1 = csDeriv(y, I, gA, EL), k2 = csDeriv(y.map((x, i) => x + 0.5 * dt * k1[i]), I, gA, EL);
  const k3 = csDeriv(y.map((x, i) => x + 0.5 * dt * k2[i]), I, gA, EL), k4 = csDeriv(y.map((x, i) => x + dt * k3[i]), I, gA, EL);
  for (let i = 0; i < 6; i++) y[i] += (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
}
/** Constant current I switched on at t = t0; returns {t, V, a, b, spikes}. */
export function csRun(I, gA, { tEnd = 400, t0 = 20, dt = 0.05, every = 4 } = {}) {
  const y = csRest(gA), EL = csEL(gA), o = { t: [], V: [], a: [], b: [] }, N = Math.round(tEnd / dt);
  for (let k = 0; k <= N; k++) {
    const t = k * dt;
    if (k % every === 0) { o.t.push(t); o.V.push(y[0]); o.a.push(y[4] ** 3 * y[5] * gA); }
    if (k < N) csStep(y, t >= t0 ? I : 0, dt, gA, EL);
  }
  o.spikes = spikeTimes(o.t, o.V, -20);
  return o;
}


/** Fast Connor–Stevens run without recording: spike times (V crossing −20 mV) for a current step I switched on at t0. */
export function csSpikes(I, gA, { tEnd = 800, t0 = 20, dt = 0.05 } = {}) {
  const EL = csEL(gA), y = Float64Array.from(csRest(gA)), a = new Float64Array(6), k1 = new Float64Array(6), k2 = new Float64Array(6), k3 = new Float64Array(6), k4 = new Float64Array(6);
  const f = (s, Ii, o) => {
    const V = s[0], m = s[1], h = s[2], n = s[3], aa = s[4], b = s[5];
    o[0] = -CS.gL * (V - EL) - CS.gNa * m * m * m * h * (V - CS.ENa) - CS.gK * n * n * n * n * (V - CS.EK) - gA * aa * aa * aa * b * (V - CS.EA) + Ii;
    o[1] = (csInf('m', V) - m) / csTau('m', V); o[2] = (csInf('h', V) - h) / csTau('h', V); o[3] = (csInf('n', V) - n) / csTau('n', V);
    o[4] = (csA.ainf(V) - aa) / csA.taua(V); o[5] = (csA.binf(V) - b) / csA.taub(V);
  };
  const N = Math.round(tEnd / dt), spikes = []; let armed = true, Vp = y[0];
  for (let k = 0; k < N; k++) {
    const t = k * dt, Ii = t >= t0 ? I : 0;
    f(y, Ii, k1);
    for (let i = 0; i < 6; i++) a[i] = y[i] + 0.5 * dt * k1[i]; f(a, Ii, k2);
    for (let i = 0; i < 6; i++) a[i] = y[i] + 0.5 * dt * k2[i]; f(a, Ii, k3);
    for (let i = 0; i < 6; i++) a[i] = y[i] + dt * k3[i]; f(a, Ii, k4);
    for (let i = 0; i < 6; i++) y[i] += (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    const V = y[0];
    if (armed && Vp < -20 && V >= -20) { spikes.push(t + dt * ((-20 - Vp) / (V - Vp))); armed = false; }
    if (V < -40) armed = true;
    Vp = V;
  }
  return spikes;
}

// ---------------------------------------------------------------- lumped Markov channels (binomial transitions per step)
const CHANNEL_LFACT = [0, 0];
/** Binomial(n,p) by exact-probability inversion from the mode; no normal/Poisson variance approximation. */
export function binom(n, p, r) {
  if (n <= 0 || p <= 0) return 0;
  if (p >= 1) return n;
  for (let i = CHANNEL_LFACT.length; i <= n; i++) CHANNEL_LFACT.push(CHANNEL_LFACT[i - 1] + Math.log(i));
  const q = 1 - p, mode = Math.min(n, Math.floor((n + 1) * p));
  const mass = Math.exp(CHANNEL_LFACT[n] - CHANNEL_LFACT[mode] - CHANNEL_LFACT[n - mode] + mode * Math.log(p) + (n - mode) * Math.log1p(-p));
  let u = r() - mass, lo = mode, hi = mode, left = mass, right = mass;
  if (u < 0) return mode;
  while (lo > 0 || hi < n) {
    if (lo > 0) { left *= lo * q / ((n - lo + 1) * p); --lo; u -= left; if (u < 0) return lo; }
    if (hi < n) { right *= (n - hi) * p / ((hi + 1) * q); ++hi; u -= right; if (u < 0) return hi; }
  }
  return mode; // only floating-point residual mass can reach this fallback
}
/** Exact transition probabilities for independent HH subunits while voltage is held fixed over dt. */
export function channelTransition(kind, V, dt, T = 6.3) {
  const phi = phiT(T), gates = (gate, count) => {
    const [a,b] = gateRates(gate,V), move = -Math.expm1(-phi*(a+b)*dt), opening = a/(a+b)*move, closing = b/(a+b)*move;
    return Array.from({length:count+1},(_,k) => {
      let row = [1];
      for(let j=0;j<count;j++){const p = j<k ? 1-closing : opening, next = Array(row.length+1).fill(0);row.forEach((q,i)=>{next[i]+=q*(1-p);next[i+1]+=q*p;});row=next;}
      return row;
    });
  };
  if(kind==='K') return gates('n',4);
  const m = gates('m',3), h = gates('h',1);
  return Array.from({length:8},(_,s) => Array.from({length:8},(_,u) => m[s%4][u%4]*h[s>=4?1:0][u>=4?1:0]));
}
/** Simultaneous multinomial redistribution of channel populations by a transition matrix. */
export function channelAdvance(counts, P, rng) {
  const next = counts.map(()=>0);
  counts.forEach((count,i)=>{let left=count,mass=1;for(let j=0;j<counts.length-1&&left;j++){const p=mass>0?Math.min(1,Math.max(0,P[i][j]/mass)):0,k=binom(left,p,rng);next[j]+=k;left-=k;mass=Math.max(0,mass-P[i][j]);}next[next.length-1]+=left;});
  return next;
}
/**
 * HH membrane with finite channel numbers: NK potassium channels (five states, k = number of open n-gates 0..4) and NNa sodium
 * channels (eight states: j open m-gates 0..3 with h open or closed). Gates flip with HH rates; transition noise is independent conditional on the common voltage.
 * Currents are conductance·(channel fraction open)·driving force, so the continuous-time large-N limit is deterministic HH (the implemented voltage step still has numerical error).
 * Ifn(t) in µA/cm². Returns {t, V, spikes}; seed makes the run reproducible.
 */
export function hhStochastic(Ifn, { NNa, NK, T = 6.3, tEnd = 100, dt = 0.025, every = 4, seed = 1, rng }) {
  const phi = phiT(T), r = rng, V0 = -65;
  const [m0, h0, n0] = [gateInf('m', V0), gateInf('h', V0), gateInf('n', V0)];
  // initial binomial draws of the gate patterns
  let K = new Array(5).fill(0), Na = new Array(8).fill(0); // Na index = j + 4·(h open ? 1 : 0)
  for (let c = 0; c < NK; c++) { let k = 0; for (let g = 0; g < 4; g++) if (r() < n0) k++; K[k]++; }
  for (let c = 0; c < NNa; c++) { let j = 0; for (let g = 0; g < 3; g++) if (r() < m0) j++; Na[j + (r() < h0 ? 4 : 0)]++; }
  let V = V0;
  const o = { t: [], V: [], nOpen: [], spikes: [] };
  const N = Math.round(tEnd / dt);
  const gNaMax = HH.gNa, gKMax = HH.gK;
  let armed = true;
  for (let kk = 0; kk <= N; kk++) {
    const t = kk * dt;
    if (kk % every === 0) { o.t.push(t); o.V.push(V); }
    if (armed && V > 0) { o.spikes.push(t); armed = false; } else if (V < -20) armed = true;
    if (kk === N) break;
    const fK = K[4] / Math.max(1, NK);
    const open = Na[3 + 4] / Math.max(1, NNa);
    const iK = gKMax * fK * (V - HH.EK), iNa = gNaMax * open * (V - HH.ENa), iL = HH.gL * (V - HH.EL);
    const Vn = V + dt * (Ifn(t) - iK - iNa - iL) / HH.C;
    // Exact channel transitions at frozen voltage include multiple subunit flips within a step.
    K = channelAdvance(K, channelTransition('K',V,dt,T), r);
    Na = channelAdvance(Na, channelTransition('Na',V,dt,T), r);
    V = Vn;
  }
  return {...o, finalK: K, finalNa: Na};
}
