// Deep Learning Theory — Chapter 1: helpers shared by ch01.js, ch01-b.js (and re-exported to chapter 2 by ch02.shared.js).
//
// A tiny but real neural-network engine (dense layers, ReLU/tanh/sigmoid, softmax cross-entropy, binary
// cross-entropy and squared error, backpropagation, SGD with momentum and Adam), seeded toy data sets, a
// least-squares solver, exact piecewise-linear algebra for 1D ReLU networks, and drawing helpers (decision
// regions, network diagrams, activation-pattern colours). Everything is plain JS with Float64Arrays: a
// training step on a few hundred points takes well under a millisecond, so items train live in the browser.

// ---------------------------------------------------------------- small utilities
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
/** Real minus sign for plain-text numbers. */
export const mnus = (s) => String(s).replace(/-/g, '−');
export const commas = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** FNV-1a: a 32-bit seed from a string. */
export function hashStr(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
/** One-slot cache: recompute only when the key changes. */
export function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }
/** Seeded generator (same mixer as v.rng): r() in [0,1), r.normal(), r.uniform(a, b), r.int(a, b). */
export function rand(seed = 1) {
  let a = (seed >>> 0) || 1;
  const next = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const r = () => next();
  r.uniform = (lo = 0, hi = 1) => lo + (hi - lo) * next();
  r.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * next());
  r.normal = (mu = 0, s = 1) => { const u = 1 - next(), w = next(); return mu + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w); };
  return r;
}
/** Logistic sigmoid, stable for large |z|. */
export const sigm = (z) => (z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)));
/** log(1 + e^z), stable. */
export const softplus = (z) => (z > 30 ? z : z < -30 ? Math.exp(z) : Math.log1p(Math.exp(z)));
/** Plain-text scientific number with superscript exponent: 3.2 × 10⁻⁵. */
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export function sci(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : '—';
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e <= 3) return mnus(x.toFixed(Math.max(0, d - e)));
  const m = x / 10 ** e; return `${mnus(m.toFixed(d - 1))} × 10${String(e).split('').map((c) => SUP[c]).join('')}`;
}
/** TeX number: 0.0123 or 1.2\times10^{-5}. */
export function tsci(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e <= 3) return x.toFixed(Math.max(0, d - e));
  return `${(x / 10 ** e).toFixed(d - 1)}\\times10^{${e}}`;
}
/** Large integer as TeX, with thin-space groups or a power of ten. */
export function tbig(x) {
  if (!isFinite(x)) return '\\infty';
  if (Math.abs(x) >= 1e7) { const e = Math.floor(Math.log10(Math.abs(x))); return `${(x / 10 ** e).toFixed(1)}\\times10^{${e}}`; }
  return Math.round(x).toLocaleString('en-US').replace(/,/g, '{,}');
}
export const binom = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };

// ---------------------------------------------------------------- activations
/** Activation functions with derivatives (d gets the pre-activation z and the output y = f(z)). */
export const ACTS = {
  relu: { f: (z) => (z > 0 ? z : 0), d: (z) => (z > 0 ? 1 : 0), tex: '\\mathrm{ReLU}(z)=\\max(0,z)' },
  tanh: { f: Math.tanh, d: (z, y) => 1 - y * y, tex: '\\tanh z' },
  sigmoid: { f: sigm, d: (z, y) => y * (1 - y), tex: '\\sigma(z)=1/(1+e^{-z})' },
  linear: { f: (z) => z, d: () => 1, tex: 'z' },
  leaky: { f: (z) => (z > 0 ? z : 0.1 * z), d: (z) => (z > 0 ? 1 : 0.1), tex: '\\max(0.1z,\\,z)' },
  softplus: { f: softplus, d: (z) => sigm(z), tex: '\\log(1+e^{z})' },
  gelu: { f: (z) => 0.5 * z * (1 + Math.tanh(0.7978845608 * (z + 0.044715 * z * z * z))), d: (z) => { const u = 0.7978845608 * (z + 0.044715 * z * z * z), t = Math.tanh(u); return 0.5 * (1 + t) + 0.5 * z * (1 - t * t) * 0.7978845608 * (1 + 3 * 0.044715 * z * z); }, tex: 'z\\,\\Phi(z)' },
};

// ---------------------------------------------------------------- the network
/**
 * Dense feed-forward network. sizes = [inputs, hidden…, outputs]; act = hidden activation (the output layer is affine:
 * the loss supplies the output nonlinearity). init 'he' (√(2/fan-in)), 'xavier' (√(2/(fan-in + fan-out))) or 'lecun' (√(1/fan-in)).
 */
export function makeNet(sizes, { act = 'relu', seed = 1, init, gain = 1, bias = 0 } = {}) {
  const r = rand(seed), L = sizes.length - 1, W = [], b = [];
  const ini = init || (act === 'relu' || act === 'leaky' ? 'he' : 'xavier');
  for (let l = 0; l < L; l++) {
    const nin = sizes[l], nout = sizes[l + 1];
    const sd = gain * (ini === 'he' ? Math.sqrt(2 / nin) : ini === 'lecun' ? Math.sqrt(1 / nin) : Math.sqrt(2 / (nin + nout)));
    const w = new Float64Array(nin * nout); for (let i = 0; i < w.length; i++) w[i] = r.normal() * sd;
    const bb = new Float64Array(nout); for (let i = 0; i < nout; i++) bb[i] = bias ? r.normal() * bias : 0;
    W.push(w); b.push(bb);
  }
  const net = { sizes: sizes.slice(), act, L, W, b };
  net.ws = workspace(net);
  return net;
}
function workspace(net) { return { z: net.sizes.map((n) => new Float64Array(n)), a: net.sizes.map((n) => new Float64Array(n)), d: net.sizes.map((n) => new Float64Array(n)) }; }
export function cloneNet(net) { const c = { sizes: net.sizes.slice(), act: net.act, L: net.L, W: net.W.map((w) => Float64Array.from(w)), b: net.b.map((x) => Float64Array.from(x)) }; c.ws = workspace(c); return c; }
export const paramCount = (net) => net.W.reduce((s, w) => s + w.length, 0) + net.b.reduce((s, x) => s + x.length, 0);
/** Forward pass; fills net.ws (z = pre-activations, a = activations, a[0] = input) and returns the raw output vector (a view: copy it to keep it). */
export function forward(net, x) {
  const { sizes, L, W, b, ws } = net, f = (ACTS[net.act] || ACTS.relu).f, relu = net.act === 'relu';
  const a0 = ws.a[0]; for (let j = 0; j < sizes[0]; j++) a0[j] = x[j];
  for (let l = 0; l < L; l++) {
    const nin = sizes[l], nout = sizes[l + 1], w = W[l], bb = b[l], ain = ws.a[l], z = ws.z[l + 1], aout = ws.a[l + 1], last = l === L - 1;
    for (let i = 0; i < nout; i++) {
      let s = bb[i]; const o = i * nin;
      for (let j = 0; j < nin; j++) s += w[o + j] * ain[j];
      z[i] = s; aout[i] = last ? s : relu ? (s > 0 ? s : 0) : f(s);
    }
  }
  return ws.a[L];
}
/** Output after the head: 'bce' → P(class 1), 'ce' → softmax probabilities (array), otherwise the raw output (scalar if 1-D). */
export function predict(net, x, head = 'mse') {
  const out = forward(net, x);
  if (head === 'bce') return sigm(out[0]);
  if (head === 'ce') return softmax(out);
  return out.length === 1 ? out[0] : Array.from(out);
}
export function softmax(z, T = 1) { let m = -Infinity; for (const u of z) m = Math.max(m, u / T); const e = Array.from(z, (u) => Math.exp(u / T - m)), s = e.reduce((p, q) => p + q, 0); return e.map((u) => u / s); }
/** Per-sample loss and output delta for a head. y: class index (ce), 0/1 (bce) or target number/array (mse). */
function headLoss(out, y, head, delta) {
  if (head === 'bce') { const z = out[0], p = sigm(z); delta[0] = p - y; return softplus(z) - y * z; }
  if (head === 'ce') {
    let m = -Infinity; for (let k = 0; k < out.length; k++) m = Math.max(m, out[k]);
    let s = 0; for (let k = 0; k < out.length; k++) s += Math.exp(out[k] - m);
    for (let k = 0; k < out.length; k++) delta[k] = Math.exp(out[k] - m) / s - (k === y ? 1 : 0);
    return -(out[y] - m - Math.log(s));
  }
  let l = 0; for (let k = 0; k < out.length; k++) { const t = typeof y === 'number' ? y : y[k], e = out[k] - t; delta[k] = 2 * e; l += e * e; }
  return l;
}
/** Zeroed gradient buffers shaped like the parameters. */
export const zeroGrad = (net) => ({ W: net.W.map((w) => new Float64Array(w.length)), b: net.b.map((x) => new Float64Array(x.length)) });
/**
 * Mean loss over (X, Y) and, unless noGrad, its gradient accumulated into g by backpropagation.
 * idx (optional) restricts to a mini-batch of indices. l2 adds (l2/2)·Σw² (weights only).
 */
export function lossGrad(net, X, Y, head, g, { idx = null, l2 = 0, noGrad = false } = {}) {
  const { sizes, L, W, ws } = net, A = ACTS[net.act] || ACTS.relu, relu = net.act === 'relu';
  if (g) { for (const w of g.W) w.fill(0); for (const x of g.b) x.fill(0); }
  const n = idx ? idx.length : X.length; let tot = 0;
  for (let t = 0; t < n; t++) {
    const i = idx ? idx[t] : t, out = forward(net, X[i]);
    const dL = ws.d[L]; tot += headLoss(out, Y[i], head, dL);
    if (noGrad || !g) continue;
    for (let l = L - 1; l >= 0; l--) {
      const nin = sizes[l], nout = sizes[l + 1], ain = ws.a[l], delta = ws.d[l + 1], gw = g.W[l], gb = g.b[l], w = W[l];
      for (let k = 0; k < nout; k++) { const dk = delta[k]; if (dk === 0) continue; gb[k] += dk; const o = k * nin; for (let j = 0; j < nin; j++) gw[o + j] += dk * ain[j]; }
      if (l > 0) {
        const dprev = ws.d[l], zp = ws.z[l];
        for (let j = 0; j < nin; j++) {
          let s = 0; for (let k = 0; k < nout; k++) s += w[k * nin + j] * delta[k];
          dprev[j] = s * (relu ? (zp[j] > 0 ? 1 : 0) : A.d(zp[j], ain[j]));
        }
      }
    }
  }
  if (g) { for (const w of g.W) for (let i = 0; i < w.length; i++) w[i] /= n; for (const x of g.b) for (let i = 0; i < x.length; i++) x[i] /= n; }
  let reg = 0;
  if (l2) for (let l = 0; l < L; l++) { const w = W[l]; for (let i = 0; i < w.length; i++) { reg += w[i] * w[i]; if (g) g.W[l][i] += l2 * w[i]; } }
  return tot / n + 0.5 * l2 * reg;
}
/** Optimizer: 'adam' (β = 0.9, 0.999) or 'sgd' (with momentum mom). Returns {step(net, g, lr)}. */
export function makeOpt(net, kind = 'adam', { mom = 0.9, b1 = 0.9, b2 = 0.999, eps = 1e-8 } = {}) {
  const m = zeroGrad(net), s = zeroGrad(net); let t = 0;
  const upd = (p, gr, mm, ss, lr) => {
    for (let i = 0; i < p.length; i++) {
      if (kind === 'adam') {
        mm[i] = b1 * mm[i] + (1 - b1) * gr[i]; ss[i] = b2 * ss[i] + (1 - b2) * gr[i] * gr[i];
        const mh = mm[i] / (1 - b1 ** t), sh = ss[i] / (1 - b2 ** t); p[i] -= (lr * mh) / (Math.sqrt(sh) + eps);
      } else { mm[i] = mom * mm[i] + gr[i]; p[i] -= lr * mm[i]; }
    }
  };
  return { step(nt, g, lr) { t++; for (let l = 0; l < nt.L; l++) { upd(nt.W[l], g.W[l], m.W[l], s.W[l], lr); upd(nt.b[l], g.b[l], m.b[l], s.b[l], lr); } } };
}
/**
 * Seeded trainer. data = {X: [[…]], Y: […]}. o: {head ('ce'|'bce'|'mse'), opt ('adam'|'sgd'), lr, batch (0 = full batch), l2, seed}.
 * T.step(k) runs k optimizer steps; T.iter, T.loss (training loss before the last step), T.hist (loss per step), T.acc().
 */
export function makeTrainer(net, data, o = {}) {
  const head = o.head || 'ce', g = zeroGrad(net), opt = makeOpt(net, o.opt || 'adam', o), r = rand(o.seed ?? 7);
  const T = { net, data, head, iter: 0, loss: NaN, hist: [] };
  T.step = (k = 1) => {
    const n = data.X.length;
    for (let s = 0; s < k; s++) {
      let idx = null;
      if (o.batch && o.batch < n) { idx = new Array(o.batch); for (let i = 0; i < o.batch; i++) idx[i] = Math.floor(r() * n); }
      T.loss = lossGrad(net, data.X, data.Y, head, g, { idx, l2: o.l2 || 0 });
      opt.step(net, g, typeof o.lr === 'function' ? o.lr(T.iter) : o.lr ?? 0.01);
      T.iter++; T.hist.push(T.loss);
    }
    return T;
  };
  T.fullLoss = () => lossGrad(net, data.X, data.Y, head, null, { noGrad: true });
  T.acc = () => accuracy(net, data, head);
  return T;
}
export function accuracy(net, data, head = 'ce') {
  let ok = 0;
  for (let i = 0; i < data.X.length; i++) {
    const out = forward(net, data.X[i]);
    let c; if (head === 'bce' || out.length === 1) c = out[0] > 0 ? 1 : 0; else { c = 0; for (let k = 1; k < out.length; k++) if (out[k] > out[c]) c = k; }
    if (c === data.Y[i]) ok++;
  }
  return ok / data.X.length;
}
/** Activation pattern of a ReLU network at x, as a string key (one bit per hidden unit). */
export function patternKey(net, x) {
  forward(net, x); let key = '';
  for (let l = 1; l < net.L; l++) { const z = net.ws.z[l]; let word = 0, bit = 0; for (let i = 0; i < z.length; i++) { if (z[i] > 0) word |= 1 << bit; if (++bit === 30) { key += word.toString(36) + '.'; word = 0; bit = 0; } } key += word.toString(36) + '|'; }
  return key;
}

// ---------------------------------------------------------------- toy data sets in [−2, 2]²
/** Seeded two-class 2D data: 'xor', 'moons', 'circles', 'spiral', 'blobs'. Returns {X, Y}. */
export function toyData(name, n = 160, { noise = 0.15, seed = 1 } = {}) {
  const r = rand(hashStr(name + '|' + n + '|' + noise + '|' + seed)), X = [], Y = [];
  for (let i = 0; i < n; i++) {
    const c = i % 2; let x, y;
    if (name === 'xor') { const sx = r() < 0.5 ? -1 : 1, sy = c ? -sx : sx; x = sx * 0.95 + r.normal() * noise * 2.2; y = sy * 0.95 + r.normal() * noise * 2.2; }
    else if (name === 'moons') { const t = Math.PI * r(); if (c === 0) { x = Math.cos(t) - 0.5; y = Math.sin(t) - 0.25; } else { x = 0.5 - Math.cos(t); y = 0.25 - Math.sin(t); } x = 1.25 * x + r.normal() * noise; y = 1.25 * y + r.normal() * noise; }
    else if (name === 'circles') { const t = 2 * Math.PI * r(), R = c ? 0.6 : 1.45; x = R * Math.cos(t) + r.normal() * noise; y = R * Math.sin(t) + r.normal() * noise; }
    else if (name === 'spiral') { const t = 0.35 + 2.6 * Math.PI * Math.sqrt(r() * 0.95 + 0.05) / Math.sqrt(1), R = (t / (2.95 * Math.PI)) * 1.75, ph = c * Math.PI; x = R * Math.cos(t + ph) + r.normal() * noise * 0.6; y = R * Math.sin(t + ph) + r.normal() * noise * 0.6; }
    else { const m = c ? [0.8, 0.6] : [-0.8, -0.5]; x = m[0] + r.normal() * (0.25 + noise * 2); y = m[1] + r.normal() * (0.25 + noise * 2); }
    X.push([x, y]); Y.push(c);
  }
  return { X, Y };
}

// ---------------------------------------------------------------- linear least squares
/** Cholesky solve of (AᵀA + ridge·I) c = Aᵀy. A: array of rows. Returns the coefficient array. */
export function lstsq(A, y, ridge = 1e-10) {
  const m = A.length, n = A[0].length, G = new Float64Array(n * n), r = new Float64Array(n);
  for (let i = 0; i < m; i++) { const a = A[i], yi = y[i]; for (let p = 0; p < n; p++) { const ap = a[p]; if (ap === 0) continue; r[p] += ap * yi; const o = p * n; for (let q = p; q < n; q++) G[o + q] += ap * a[q]; } }
  let tr = 0; for (let p = 0; p < n; p++) tr += G[p * n + p];
  const lam = ridge * Math.max(1e-300, tr / n);
  for (let p = 0; p < n; p++) { G[p * n + p] += lam; for (let q = 0; q < p; q++) G[p * n + q] = G[q * n + p]; }
  return cholSolve(G, r, n);
}
/** Solve G c = r for a symmetric positive-definite n×n G (flat array); adds jitter if needed. */
export function cholSolve(G, r, n) {
  const Lm = new Float64Array(n * n);
  for (let attempt = 0; attempt < 6; attempt++) {
    let ok = true; const jit = attempt ? 10 ** (attempt - 13) * (G[0] + 1) : 0;
    for (let i = 0; i < n && ok; i++) for (let j = 0; j <= i; j++) {
      let s = G[i * n + j] + (i === j ? jit : 0); for (let k = 0; k < j; k++) s -= Lm[i * n + k] * Lm[j * n + k];
      if (i === j) { if (!(s > 0)) { ok = false; break; } Lm[i * n + i] = Math.sqrt(s); } else Lm[i * n + j] = s / Lm[j * n + j];
    }
    if (!ok) continue;
    const z = new Float64Array(n); for (let i = 0; i < n; i++) { let s = r[i]; for (let k = 0; k < i; k++) s -= Lm[i * n + k] * z[k]; z[i] = s / Lm[i * n + i]; }
    const c = new Float64Array(n); for (let i = n - 1; i >= 0; i--) { let s = z[i]; for (let k = i + 1; k < n; k++) s -= Lm[k * n + i] * c[k]; c[i] = s / Lm[i * n + i]; }
    return Array.from(c);
  }
  return new Array(n).fill(0);
}
/** Numerical rank of the columns of A (rows) by Gram–Schmidt with relative tolerance. */
export function colRank(A, tol = 1e-9) {
  const m = A.length, n = A[0].length, Q = []; let rank = 0, scale = 0;
  for (let j = 0; j < n; j++) { let s = 0; for (let i = 0; i < m; i++) s += A[i][j] * A[i][j]; scale = Math.max(scale, Math.sqrt(s)); }
  for (let j = 0; j < n; j++) {
    const v = new Float64Array(m); for (let i = 0; i < m; i++) v[i] = A[i][j];
    for (let pass = 0; pass < 2; pass++) for (const q of Q) { let d = 0; for (let i = 0; i < m; i++) d += q[i] * v[i]; for (let i = 0; i < m; i++) v[i] -= d * q[i]; }
    let nv = 0; for (let i = 0; i < m; i++) nv += v[i] * v[i]; nv = Math.sqrt(nv);
    if (nv > tol * scale) { for (let i = 0; i < m; i++) v[i] /= nv; Q.push(v); rank++; }
  }
  return rank;
}

// ---------------------------------------------------------------- exact piecewise-linear functions on an interval
// A continuous PL function is a sorted array of knots [[x0, y0], [x1, y1], …] (linear in between, constant outside).
export function plEval(P, x) {
  if (x <= P[0][0]) return P[0][1];
  const n = P.length; if (x >= P[n - 1][0]) return P[n - 1][1];
  let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P[m][0] <= x) lo = m; else hi = m; }
  const [x0, y0] = P[lo], [x1, y1] = P[hi]; return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0 || 1);
}
/** Drop knots where the slope does not change (relative tolerance), so pieces = knots − 1. */
export function plSimplify(P, tol = 1e-9) {
  const out = [P[0]];
  for (let i = 1; i < P.length - 1; i++) {
    const [xa, ya] = out[out.length - 1], [xb, yb] = P[i], [xc, yc] = P[i + 1];
    if (xb - xa < 1e-13) continue;
    const s1 = (yb - ya) / (xb - xa), s2 = (yc - yb) / (xc - xb || 1e-300);
    if (Math.abs(s1 - s2) > tol * (1 + Math.abs(s1) + Math.abs(s2))) out.push(P[i]);
  }
  out.push(P[P.length - 1]); return out;
}
/** Exact composition h∘g of PL functions on g's domain: breakpoints of g plus g⁻¹(breakpoints of h). */
export function plCompose(h, g) {
  const out = [];
  for (let i = 0; i < g.length - 1; i++) {
    const [xa, ya] = g[i], [xb, yb] = g[i + 1];
    out.push([xa, plEval(h, ya)]);
    const lo = Math.min(ya, yb), hi = Math.max(ya, yb), cut = [];
    for (const [u] of h) if (u > lo && u < hi) cut.push(xa + ((u - ya) / (yb - ya)) * (xb - xa));
    cut.sort((p, q) => (xb > xa ? p - q : q - p));
    for (const x of cut) out.push([x, plEval(h, plEval(g, x))]);
  }
  out.push([g[g.length - 1][0], plEval(h, g[g.length - 1][1])]);
  return plSimplify(out);
}
export const plPieces = (P) => plSimplify(P).length - 1;
/** Sup distance between a PL function and f on [a, b], by dense sampling plus the knots. */
export function supErr(f, g, a, b, n = 2000) { let e = 0, at = a; for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n, d = Math.abs(f(x) - g(x)); if (d > e) { e = d; at = x; } } return { err: e, at }; }

// ---------------------------------------------------------------- drawing helpers
/** Corner note inside the data area (respects gutters): pos 'tl' | 'tr' | 'bl' | 'br'. */
export function note(s, str, pos = 'tl', st = {}) {
  const b = s.bounds, x = pos[1] === 'l' ? b.x[0] : b.x[1], y = pos[0] === 't' ? b.y[1] : b.y[0];
  s.text(str, x, y, { size: 12, color: 'muted', align: pos[1] === 'l' ? 'left' : 'right', baseline: pos[0] === 't' ? 'top' : 'bottom', dx: pos[1] === 'l' ? 8 : -8, dy: pos[0] === 't' ? 7 : -7, plate: true, ...st });
}
/** Legend / title setters that touch the DOM only when the content changes. */
export function titler(s) { let last = null; return (t) => { if (t !== last) { last = t; s.setTitle(t); } }; }
/** Lookup table of n colours ramping from the panel colour to `to` (theme-aware; rebuild per theme via key). */
export function rampLUT(v, to, n = 64, from = 'panel', max = 1) { const out = []; for (let i = 0; i < n; i++) out.push(v.ramp((max * i) / (n - 1), to, from)); return out; }
const CYCLE = ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'blue'];
/** Distinct theme-aware fill colours for linear regions: palette hues at three strengths. */
export function regionColors(v) { const out = []; for (const k of [0.42, 0.24, 0.6]) for (const c of CYCLE) out.push(v.ramp(k, c)); return out; }
/**
 * Two-class decision-region raster: prob(x, y) → P(class 1). Class 0 is blue (accent), class 1 orange; the colour deepens with confidence.
 * The 0.5 contour is left to the caller (s.contour). key must change whenever the model changes.
 */
export function regionRaster(s, v, prob, { key, res = 3, strength = 0.62, id } = {}) {
  const A = rampLUT(v, 'accent', 48, 'panel', strength), O = rampLUT(v, 'orange', 48, 'panel', strength);
  s.raster((x, y) => { const p = prob(x, y); if (!(p === p)) return null; const t = Math.min(47, Math.round(Math.abs(2 * p - 1) * 47)); return p >= 0.5 ? O[t] : A[t]; }, { res, key, id });
}
/** Data points of a two-class set: class 0 accent, class 1 orange; wrong(i) → true draws a red ring. */
export function drawPoints(s, data, { r = 4.2, wrong, alpha } = {}) {
  for (let i = 0; i < data.X.length; i++) {
    const [x, y] = data.X[i], c = data.Y[i];
    s.dot(x, y, { r, color: c ? 'orange' : 'accent', alpha });
    if (wrong && wrong(i)) s.circle(x, y, 0, {}) && s.dot(x, y, { r: r + 3, hollow: true, color: 'red', width: 1.6 });
  }
}
/**
 * Network diagram in a box [x0, x1] × [y0, y1] of stage s (data units): columns of nodes, edges coloured by the sign of the
 * weight (accent = positive, orange = negative), width ∝ |w|. o.thumbs(l, i) → optional function (u, w) ∈ [0,1]² → colour
 * [r,g,b] drawn as a small heat-map thumbnail inside the node (cells² cells); o.act(l, i) → value in [0,1] for a node tint.
 * o.labels: {in: [...], out: [...]} TeX strings. Returns the node positions [[x, y], …] per layer.
 */
export function drawNet(s, v, net, box, o = {}) {
  const [x0, x1, y0, y1] = box, L = net.L, sizes = net.sizes, pos = [];
  const maxN = Math.max(...sizes), colX = (l) => (L === 0 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * l) / L);
  const gap = (y1 - y0) / Math.max(1, maxN), rpx = o.r ?? Math.max(7, Math.min(16, (Math.abs(s.Y(y0) - s.Y(y1)) / maxN) * 0.33));
  for (let l = 0; l <= L; l++) { const n = sizes[l], col = []; for (let i = 0; i < n; i++) col.push([colX(l), (y0 + y1) / 2 + (i - (n - 1) / 2) * gap]); pos.push(col); }
  let wmax = 1e-9; for (const w of net.W) for (const u of w) wmax = Math.max(wmax, Math.abs(u));
  if (o.wmax) wmax = o.wmax;
  for (let l = 0; l < L; l++) {
    const nin = sizes[l], nout = sizes[l + 1], w = net.W[l];
    for (let i = 0; i < nout; i++) for (let j = 0; j < nin; j++) {
      const u = w[i * nin + j], t = Math.min(1, Math.abs(u) / wmax);
      if (t < 0.02) continue;
      s.line(pos[l][j][0], pos[l][j][1], pos[l + 1][i][0], pos[l + 1][i][1], { color: u >= 0 ? 'accent' : 'orange', width: 0.4 + 4.2 * t, alpha: 0.25 + 0.7 * t });
    }
  }
  const ctx = s.ctx, cells = o.cells ?? 10;
  for (let l = 0; l <= L; l++) for (let i = 0; i < sizes[l]; i++) {
    const [x, y] = pos[l][i], X = s.X(x), Y = s.Y(y);
    const th = o.thumbs && l > 0 && l < L ? o.thumbs(l, i) : null;
    if (th) {
      const side = rpx * 1.9, c0 = X - side / 2, r0 = Y - side / 2, cs = side / cells;
      ctx.save();
      for (let a = 0; a < cells; a++) for (let bq = 0; bq < cells; bq++) { const col = th((a + 0.5) / cells, 1 - (bq + 0.5) / cells); ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`; ctx.fillRect(c0 + a * cs, r0 + bq * cs, cs + 0.6, cs + 0.6); }
      ctx.strokeStyle = v.color('ink', 0.55); ctx.lineWidth = 1; ctx.strokeRect(c0 + 0.5, r0 + 0.5, side - 1, side - 1);
      ctx.restore();
    } else {
      const t = o.act ? o.act(l, i) : null;
      s.dot(x, y, { r: rpx, color: t == null ? 'panel' : null, hollow: t == null });
      if (t != null) { const col = v.ramp(clamp(t, 0, 1), l === L ? 'green' : 'gold'); s.dot(x, y, { r: rpx, color: col }); }
      s.dot(x, y, { r: rpx, hollow: true, color: 'ink', width: 1.3, alpha: 0.7 });
    }
  }
  if (o.labels?.in) o.labels.in.forEach((t, i) => pos[0][i] && s.tex(t, pos[0][i][0], pos[0][i][1], { dx: -rpx - 6, align: 'right', size: 14, color: 'muted' }));
  if (o.labels?.out) o.labels.out.forEach((t, i) => pos[L][i] && s.tex(t, pos[L][i][0], pos[L][i][1], { dx: rpx + 6, align: 'left', size: 14, color: 'muted' }));
  return pos;
}
