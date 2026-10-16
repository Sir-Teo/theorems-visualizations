// Deep Learning Theory — Chapter 5: helpers shared by ch05*.js.
// Chapters 1–4's engine (dense nets, data sets, drawing helpers) is re-exported from ch04.shared.js. New here:
//   - random deep-network experiments (forward activations, backward gradients, input–output Jacobians) in plain arrays;
//   - Gauss–Hermite mean-field integrals for signal propagation (variance map, correlation map, χ₁);
//   - a batched deep MLP ("DNet") with optional residual connections and batch normalization, full backpropagation,
//     per-layer gradient norms and an SGD-with-momentum trainer — used for the degradation / ResNet / batch-norm items.
export * from './ch04.shared.js';
import { rand } from './ch04.shared.js';

// ---------------------------------------------------------------- activations by name
export const PHI = {
  tanh: { f: Math.tanh, d: (z, y) => 1 - y * y },
  relu: { f: (z) => (z > 0 ? z : 0), d: (z) => (z > 0 ? 1 : 0) },
  sigmoid: { f: (z) => (z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z))), d: (z, y) => y * (1 - y) },
  linear: { f: (z) => z, d: () => 1 },
};

// ---------------------------------------------------------------- random deep networks (no training)
/**
 * One random width-N, depth-L network with weights N(0, gain²·cw/N) (cw = 1 is "variance 1/fan-in"), biases N(0, bs²).
 * Pushes a random input (unit variance per coordinate) forward and a random output covector back.
 * Returns {act: [rms of the activations after each layer, layers 0..L], std: same, grad: [rms of ∂/∂h_l, l = L..0 as index l]}.
 * Activations are also returned for the layers listed in keep.
 */
export function randomDeep({ N = 200, L = 50, act = 'tanh', cw = 1, bs = 0, seed = 1, keep = [] }) {
  const r = rand(seed), P = PHI[act], sd = Math.sqrt(cw / N);
  const W = [], z = [], h = [new Float64Array(N)];
  for (let i = 0; i < N; i++) h[0][i] = r.normal();
  const kept = {};
  const b = [];
  for (let l = 0; l < L; l++) {
    const w = new Float64Array(N * N); for (let i = 0; i < w.length; i++) w[i] = r.normal() * sd;
    const bb = new Float64Array(N); if (bs) for (let i = 0; i < N; i++) bb[i] = r.normal() * bs;
    W.push(w); b.push(bb);
    const zl = new Float64Array(N), hl = new Float64Array(N), hp = h[l];
    for (let i = 0; i < N; i++) { let s = bb[i]; const o = i * N; for (let j = 0; j < N; j++) s += w[o + j] * hp[j]; zl[i] = s; hl[i] = P.f(s); }
    z.push(zl); h.push(hl);
    if (keep.includes(l + 1)) kept[l + 1] = Array.from(hl);
  }
  const rms = (a) => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length);
  const std = h.map(rms);
  // backward: g_L random unit-variance covector; g_{l} = Wᵀ (φ'(z_{l+1}) ⊙ g_{l+1})
  const g = new Array(L + 1); g[L] = new Float64Array(N); for (let i = 0; i < N; i++) g[L][i] = r.normal();
  for (let l = L - 1; l >= 0; l--) {
    const d = new Float64Array(N), w = W[l], gl = new Float64Array(N);
    for (let i = 0; i < N; i++) d[i] = g[l + 1][i] * P.d(z[l][i], h[l + 1][i]);
    for (let i = 0; i < N; i++) { const di = d[i]; if (di === 0) continue; const o = i * N; for (let j = 0; j < N; j++) gl[j] += w[o + j] * di; }
    g[l] = gl;
  }
  return { std, grad: g.map(rms), kept, h0: Array.from(h[0]) };
}

// ---------------------------------------------------------------- Gauss–Hermite quadrature and mean-field maps
// Nodes/weights for ∫ e^{-x²} f(x) dx, computed once by Newton's method on the Hermite polynomial.
function hermite(n) {
  const x = new Float64Array(n), w = new Float64Array(n);
  for (let i = 0; i < Math.ceil(n / 2); i++) {
    let z = i === 0 ? Math.sqrt(2 * n + 1) - 1.85575 * (2 * n + 1) ** (-1 / 6) : i === 1 ? x[0] - 1.14 * n ** 0.426 / x[0] : i === 2 ? 1.86 * x[1] - 0.86 * x[0] : i === 3 ? 1.91 * x[2] - 0.91 * x[1] : 2 * x[i - 1] - x[i - 2];
    let pp = 0;
    for (let it = 0; it < 60; it++) {
      let p1 = Math.PI ** -0.25, p2 = 0;
      for (let j = 0; j < n; j++) { const p3 = p2; p2 = p1; p1 = z * Math.sqrt(2 / (j + 1)) * p2 - Math.sqrt(j / (j + 1)) * p3; }
      pp = Math.sqrt(2 * n) * p2; const dz = p1 / pp; z -= dz; if (Math.abs(dz) < 1e-14) break;
    }
    x[i] = z; x[n - 1 - i] = -z; w[i] = w[n - 1 - i] = 2 / (pp * pp);
  }
  return { x, w };
}
const GH = hermite(48);
/** E f(Z), Z ~ N(0,1). */
export function gauss1(f) { let s = 0; for (let i = 0; i < GH.x.length; i++) s += GH.w[i] * f(Math.SQRT2 * GH.x[i]); return s / Math.sqrt(Math.PI); }
/** E f(Z1, Z2) for independent standard normals. */
export function gauss2(f) {
  let s = 0; const n = GH.x.length;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += GH.w[i] * GH.w[j] * f(Math.SQRT2 * GH.x[i], Math.SQRT2 * GH.x[j]);
  return s / Math.PI;
}
/** Variance map q ← σw² E φ(√q z)² + σb² : fixed point q*, found by iteration from q0. */
export function qStar(act, sw2, sb2, q0 = 1, iters = 300) {
  const f = PHI[act].f; let q = q0;
  for (let i = 0; i < iters; i++) q = sw2 * gauss1((z) => f(Math.sqrt(q) * z) ** 2) + sb2;
  return q;
}
/** Correlation map c ↦ (σw² E φ(u1)φ(u2) + σb²)/q* at the fixed point q*, with corr(u1,u2) = c. */
export function corrMap(act, sw2, sb2, qs, c) {
  const f = PHI[act].f, sq = Math.sqrt(qs), s2 = Math.sqrt(Math.max(0, 1 - c * c));
  return (sw2 * gauss2((z1, z2) => f(sq * z1) * f(sq * (c * z1 + s2 * z2))) + sb2) / qs;
}
/** χ₁ = σw² E φ'(√q* z)² : slope of the correlation map at c = 1; χ₁ = 1 is the edge of chaos. */
export function chi1(act, sw2, qs) { const P = PHI[act]; return sw2 * gauss1((z) => { const u = Math.sqrt(qs) * z; return P.d(u, P.f(u)) ** 2; }); }

// ---------------------------------------------------------------- the batched deep MLP with skips and batch norm
/**
 * DNet: x (inDim) → hidden layer 1 (width) → … → hidden layer H → linear head (outDim classes, softmax cross-entropy).
 * Hidden layer l ≥ 2 is plain  h ← φ(BN(W h + b))  or, with residual, a skip  h ← h + φ(BN(W h + b)).
 * opts: {H, width, act ('relu'), residual, bn, seed, gain (scale of every weight matrix on top of He, default 1),
 *        rgain (extra scale on residual-branch weights, default 0.3)}.
 */
export function makeDNet(o = {}) {
  const { H = 10, width = 12, inDim = 2, outDim = 2, act = 'relu', residual = false, bn = false, seed = 1, gain = 1, rgain: rg } = o; const rgain = rg ?? Math.min(0.5, 1.2 / Math.sqrt(H));
  const r = rand(seed), P = PHI[act];
  const sizes = [inDim]; for (let l = 0; l < H; l++) sizes.push(width); sizes.push(outDim);
  const net = { H, width, inDim, outDim, act, P, residual, bn, W: [], b: [], gam: [], bet: [], sizes, step: 0 };
  for (let l = 0; l <= H; l++) {
    const nin = sizes[l], nout = sizes[l + 1], head = l === H;
    const sc = head ? Math.sqrt(1 / nin) : Math.sqrt((act === 'relu' ? 2 : 1) / nin) * gain * (residual && l >= 1 ? rgain : 1);
    const w = new Float64Array(nin * nout); for (let i = 0; i < w.length; i++) w[i] = r.normal() * sc;
    net.W.push(w); net.b.push(new Float64Array(nout));
    net.gam.push(new Float64Array(nout).fill(1)); net.bet.push(new Float64Array(nout));
  }
  net.vel = { W: net.W.map((w) => new Float64Array(w.length)), b: net.b.map((x) => new Float64Array(x.length)), gam: net.gam.map((x) => new Float64Array(x.length)), bet: net.bet.map((x) => new Float64Array(x.length)) };
  net.grad = { W: net.W.map((w) => new Float64Array(w.length)), b: net.b.map((x) => new Float64Array(x.length)), gam: net.gam.map((x) => new Float64Array(x.length)), bet: net.bet.map((x) => new Float64Array(x.length)) };
  net.gnorm = new Float64Array(H + 1);
  return net;
}
const EPS = 1e-5;
/**
 * Forward (and, if want, backward) pass on a batch X (array of vectors) with labels Y (class indices).
 * Returns {loss, acc}. With want = true fills net.grad and net.gnorm[l] = rms over the batch of ‖∂ℓ_i/∂h_l‖
 * (per-example gradient with respect to the output of hidden layer l, l = 0..H−1; h_0 is the input).
 * statsFrom: optional {mu, var} per layer to normalize with instead of batch statistics (evaluation).
 */
export function dnetRun(net, X, Y, want = false, bnTrain = true) {
  const n = X.length, { H, width, sizes, P, residual, bn } = net, ws = (net._wsm || (net._wsm = {}))[n] || (net._wsm[n] = allocWS(net, n));
  const { A, Z, Zh, Pre, Y2, mu, sd } = ws;
  for (let i = 0; i < n; i++) for (let j = 0; j < sizes[0]; j++) A[0][i * sizes[0] + j] = X[i][j];
  for (let l = 0; l < H; l++) {
    const nin = sizes[l], nout = sizes[l + 1], w = net.W[l], b = net.b[l], a = A[l], z = Z[l];
    for (let i = 0; i < n; i++) for (let k = 0; k < nout; k++) { let s = b[k]; const o = k * nin, ao = i * nin; for (let j = 0; j < nin; j++) s += w[o + j] * a[ao + j]; z[i * nout + k] = s; }
    const pre = Pre[l], zh = Zh[l];
    if (bn) {
      for (let k = 0; k < nout; k++) {
        let m, v;
        if (bnTrain) { m = 0; for (let i = 0; i < n; i++) m += z[i * nout + k]; m /= n; v = 0; for (let i = 0; i < n; i++) { const d = z[i * nout + k] - m; v += d * d; } v /= n; mu[l][k] = m; sd[l][k] = Math.sqrt(v + EPS); }
        else { m = net.runMu ? net.runMu[l][k] : mu[l][k]; v = net.runVar ? net.runVar[l][k] : sd[l][k] ** 2; sd[l][k] = Math.sqrt(v + EPS); mu[l][k] = m; }
        for (let i = 0; i < n; i++) { const h = (z[i * nout + k] - mu[l][k]) / sd[l][k]; zh[i * nout + k] = h; pre[i * nout + k] = net.gam[l][k] * h + net.bet[l][k]; }
      }
    } else for (let q = 0; q < n * nout; q++) pre[q] = z[q];
    const y = Y2[l], out = A[l + 1], skip = residual && l >= 1;
    for (let q = 0; q < n * nout; q++) { y[q] = P.f(pre[q]); out[q] = skip ? y[q] + a[q] : y[q]; }
  }
  // head
  const nin = sizes[H], nout = sizes[H + 1], w = net.W[H], b = net.b[H], a = A[H], logit = ws.logit; let loss = 0, ok = 0;
  for (let i = 0; i < n; i++) {
    let m = -Infinity;
    for (let k = 0; k < nout; k++) { let s = b[k]; const o = k * nin; for (let j = 0; j < nin; j++) s += w[o + j] * a[i * nin + j]; logit[i * nout + k] = s; if (s > m) m = s; }
    let t = 0, am = 0; for (let k = 0; k < nout; k++) { t += Math.exp(logit[i * nout + k] - m); if (logit[i * nout + k] > logit[i * nout + am]) am = k; }
    loss -= logit[i * nout + Y[i]] - m - Math.log(t); if (am === Y[i]) ok++;
    if (want) for (let k = 0; k < nout; k++) ws.dA[H][i * nout + k] = (Math.exp(logit[i * nout + k] - m) / t - (k === Y[i] ? 1 : 0));
  }
  loss /= n;
  if (!want) return { loss, acc: ok / n };
  // backward. dA[H] is currently the logit gradient (per example, not divided by n); reuse arrays.
  const g = net.grad; for (const kind of ['W', 'b', 'gam', 'bet']) for (const x of g[kind]) x.fill(0);
  const dl = ws.dA[H], dh = ws.dH[H]; dh.fill(0);
  for (let i = 0; i < n; i++) for (let k = 0; k < nout; k++) {
    const d = dl[i * nout + k]; g.b[H][k] += d / n; const o = k * nin;
    for (let j = 0; j < nin; j++) { g.W[H][o + j] += d * a[i * nin + j] / n; dh[i * nin + j] += w[o + j] * d; }
  }
  const rmsOf = (arr, dim) => { let s = 0; for (let q = 0; q < arr.length; q++) s += arr[q] * arr[q]; return Math.sqrt(s / n); };
  net.gnorm[H] = rmsOf(dh, nin);
  for (let l = H - 1; l >= 0; l--) {
    const nin = sizes[l], nout = sizes[l + 1], skip = residual && l >= 1;
    const dOut = ws.dH[l + 1], pre = Pre[l], y = Y2[l], dP = ws.dP[l];
    for (let q = 0; q < n * nout; q++) dP[q] = dOut[q] * P.d(pre[q], y[q]);
    const dZ = ws.dZ[l];
    if (bn) {
      const zh = Zh[l];
      for (let k = 0; k < nout; k++) {
        let sg = 0, sb = 0, s1 = 0, s2 = 0; const gm = net.gam[l][k];
        for (let i = 0; i < n; i++) { const d = dP[i * nout + k]; sg += d * zh[i * nout + k]; sb += d; const dzh = d * gm; s1 += dzh; s2 += dzh * zh[i * nout + k]; }
        g.gam[l][k] = sg / n; g.bet[l][k] = sb / n;
        for (let i = 0; i < n; i++) { const dzh = dP[i * nout + k] * gm; dZ[i * nout + k] = (dzh - s1 / n - zh[i * nout + k] * s2 / n) / sd[l][k]; }
      }
    } else for (let q = 0; q < n * nout; q++) dZ[q] = dP[q];
    const dIn = ws.dH[l], w2 = net.W[l], a2 = A[l]; if (skip) for (let q = 0; q < n * nin; q++) dIn[q] = dOut[q]; else dIn.fill(0);
    for (let i = 0; i < n; i++) for (let k = 0; k < nout; k++) {
      const d = dZ[i * nout + k]; if (d === 0) continue; g.b[l][k] += d / n; const o = k * nin;
      for (let j = 0; j < nin; j++) { g.W[l][o + j] += d * a2[i * nin + j] / n; dIn[i * nin + j] += w2[o + j] * d; }
    }
    net.gnorm[l] = rmsOf(dIn, nin);
  }
  return { loss, acc: ok / n };
}
function allocWS(net, n) {
  const { H, sizes } = net, mk = (len) => new Float64Array(len), arr = (f) => Array.from({ length: H }, (_, l) => f(l));
  return {
    n, A: Array.from({ length: H + 1 }, (_, l) => mk(n * sizes[l])), Z: arr((l) => mk(n * sizes[l + 1])), Zh: arr((l) => mk(n * sizes[l + 1])),
    Pre: arr((l) => mk(n * sizes[l + 1])), Y2: arr((l) => mk(n * sizes[l + 1])), mu: arr((l) => mk(sizes[l + 1])), sd: arr((l) => mk(sizes[l + 1])),
    logit: mk(n * sizes[H + 1]), dA: Array.from({ length: H + 1 }, (_, l) => mk(n * sizes[l])), dH: Array.from({ length: H + 1 }, (_, l) => mk(n * sizes[l])),
    dP: arr((l) => mk(n * sizes[l + 1])), dZ: arr((l) => mk(n * sizes[l + 1])),
  };
}
/** One SGD-with-momentum step on the stored gradient. */
export function dnetStep(net, lr, mom = 0.9, clip = 0) {
  const g = net.grad, v = net.vel; let scale = 1;
  if (clip) { let s = 0; for (const kind of ['W', 'b', 'gam', 'bet']) for (const x of g[kind]) for (let i = 0; i < x.length; i++) s += x[i] * x[i]; const nrm = Math.sqrt(s); if (nrm > clip) scale = clip / nrm; }
  for (const kind of ['W', 'b']) for (let l = 0; l < g[kind].length; l++) { const gg = g[kind][l], vv = v[kind][l], p = net[kind][l]; for (let i = 0; i < gg.length; i++) { vv[i] = mom * vv[i] + scale * gg[i]; p[i] -= lr * vv[i]; } }
  if (net.bn) for (const kind of ['gam', 'bet']) for (let l = 0; l < net.H; l++) { const gg = g[kind][l], vv = v[kind][l], p = net[kind][l]; for (let i = 0; i < gg.length; i++) { vv[i] = mom * vv[i] + scale * gg[i]; p[i] -= lr * vv[i]; } }
  net.step++;
}

// ---------------------------------------------------------------- racing several DNets on the same data
/** Class-1 probability of a (non-batch-norm) DNet at a single point. */
export function dnetProb(net, x) {
  dnetRun(net, [x], [0], false);
  const lg = net._wsm[1].logit, m = Math.max(lg[0], lg[1]), a = Math.exp(lg[0] - m), b = Math.exp(lg[1] - m);
  return b / (a + b);
}
/**
 * Train several DNets side by side, one full-batch step at a time.
 * cfgs: [{name, H, residual, bn, act, width, seed}], train/test: {X, Y}. Each run records, per step, the training loss and error
 * (hist.loss, hist.err), every `every` steps the test error (hist.test: [step, err]), and the per-layer gradient rms
 * (run.gn now, run.gn0 at step 0, run.gnHist every `every` steps).
 */
export function makeRace(cfgs, train, test, { lr = 0.015, mom = 0.9, every = 10, maxSteps = 500, clip = 0 } = {}) {
  const runs = cfgs.map((c) => ({ cfg: c, net: makeDNet({ width: 10, act: 'tanh', seed: 5, ...c }), hist: { loss: [], err: [], test: [] }, gn: null, gn0: null, gnHist: [] }));
  const R = { runs, steps: 0, maxSteps, train, test };
  R.step = () => {
    if (R.steps >= maxSteps) return false;
    for (const r of runs) {
      const o = dnetRun(r.net, train.X, train.Y, true);
      r.hist.loss.push(o.loss); r.hist.err.push(1 - o.acc);
      r.gn = Float64Array.from(r.net.gnorm); if (!r.gn0) r.gn0 = r.gn;
      if (R.steps % every === 0) { const t = dnetRun(r.net, test.X, test.Y, false); r.hist.test.push([R.steps, 1 - t.acc]); r.gnHist.push(r.gn); }
      dnetStep(r.net, lr, mom, clip);
    }
    R.steps++; return true;
  };
  R.finish = () => {
    for (const r of runs) { const o = dnetRun(r.net, train.X, train.Y, false), t = dnetRun(r.net, test.X, test.Y, false); r.hist.test.push([R.steps, 1 - t.acc]); r.final = { loss: o.loss, err: 1 - o.acc, test: 1 - t.acc }; }
  };
  return R;
}
