// Deep Learning Theory — Chapter 3: Backpropagation and automatic differentiation (items 3.7–3.11)
//
// Gradient checking on a real tape (optionally in simulated float32), backpropagation through time against finite
// differences, a simulated checkpointing schedule that also runs on real vectors, implicit differentiation of a
// fixed-point layer, and the two experiments of Rumelhart, Hinton & Williams (1986) trained live.
import {
  clamp, memo, mnus, tsci, f3, rand, hashStr, sigm, titler, makeNet, lossGrad, Tape,
} from './ch03.shared.js';

// ---------------------------------------------------------------- 3.7: a small tanh network on a tape
const GC_SIZES = [2, 3, 3, 1];
const GC_DATA = (() => { const r = rand(hashStr('gc-data')), X = [], Y = []; for (let i = 0; i < 6; i++) { const x = [r.uniform(-1.5, 1.5), r.uniform(-1.5, 1.5)]; X.push(x); Y.push(Math.sin(1.7 * x[0]) * 0.6 + 0.3 * x[1]); } return { X, Y }; })();
const GC_THETA = (() => { const r = rand(hashStr('gc-theta')), n = GC_SIZES.slice(1).reduce((s, m, l) => s + m * (GC_SIZES[l] + 1), 0); return Float64Array.from({ length: n }, () => r.normal() * 0.8); })();
/** Which layer (0, 1, 2) and role ('w'/'b') each parameter belongs to. */
const GC_ROLE = (() => { const out = []; for (let l = 0; l < 3; l++) { const nin = GC_SIZES[l], nout = GC_SIZES[l + 1]; for (let i = 0; i < nout; i++) { for (let j = 0; j < nin; j++) out.push({ l, r: 'w', i, j }); out.push({ l, r: 'b', i }); } } return out; })();
/** Mean squared error of the network with parameters th, recorded on a tape. */
function gcLoss(th, o = {}) {
  const T = new Tape(o), P = Array.from(th, (t) => T.input(t)); let k = 0, tot = null;
  const prm = []; for (let l = 0; l < 3; l++) { const nin = GC_SIZES[l], nout = GC_SIZES[l + 1], W = [], b = []; for (let i = 0; i < nout; i++) { const row = []; for (let j = 0; j < nin; j++) row.push(P[k++]); W.push(row); b.push(P[k++]); } prm.push({ W, b }); }
  GC_DATA.X.forEach((x, n) => {
    let a = x.map((u) => T.input(u));
    for (let l = 0; l < 3; l++) { const { W, b } = prm[l]; a = W.map((row, i) => { const z = T.add(T.dot(a, row), b[i]); return l < 2 ? T.tanh(z) : z; }); }
    const e = T.addc(a[0], -GC_DATA.Y[n]), sq = T.sqr(e); tot = tot == null ? sq : T.add(tot, sq);
  });
  const L = T.mulc(tot, 1 / GC_DATA.X.length);
  return { T, L, P };
}

// ---------------------------------------------------------------- 3.11: the family trees (Hinton, 1986)
// Canonical order for both families: 0 Christopher/Roberto (m) 1 Penelope/Maria (f) 2 Andrew/Pierro (m) 3 Christine/Francesca (f)
// 4 Margaret/Gina (f) 5 Arthur/Emilio (m) 6 Victoria/Lucia (f) 7 James/Marco (m) 8 Jennifer/Angela (f) 9 Charles/Tomaso (m)
// 10 Colin/Alfonso (m) 11 Charlotte/Sophia (f). Arthur and Victoria are children of 0+1, James and Jennifer of 2+3,
// Colin and Charlotte of James+Victoria; spouses 0–1, 2–3, 4–5, 6–7, 8–9.
const NAMES = [['Christopher', 'Penelope', 'Andrew', 'Christine', 'Margaret', 'Arthur', 'Victoria', 'James', 'Jennifer', 'Charles', 'Colin', 'Charlotte'],
  ['Roberto', 'Maria', 'Pierro', 'Francesca', 'Gina', 'Emilio', 'Lucia', 'Marco', 'Angela', 'Tomaso', 'Alfonso', 'Sophia']];
const SEX = ['m', 'f', 'm', 'f', 'f', 'm', 'f', 'm', 'f', 'm', 'm', 'f'];
const GEN = [1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3];
const SPOUSE = { 0: 1, 1: 0, 2: 3, 3: 2, 4: 5, 5: 4, 6: 7, 7: 6, 8: 9, 9: 8 };
const PAR = { 5: [0, 1], 6: [0, 1], 7: [2, 3], 8: [2, 3], 10: [7, 6], 11: [7, 6] };
const RELS = ['father', 'mother', 'husband', 'wife', 'son', 'daughter', 'uncle', 'aunt', 'brother', 'sister', 'nephew', 'niece'];
const TRIPLES = (() => {
  const kids = (p) => Object.keys(PAR).map(Number).filter((c) => PAR[c].includes(p));
  const sibs = (p) => (PAR[p] ? Object.keys(PAR).map(Number).filter((c) => c !== p && PAR[c][0] === PAR[p][0]) : []);
  const ua = (p, s) => { const o = new Set(); if (PAR[p]) for (const q of PAR[p]) for (const b of sibs(q)) { if (SEX[b] === s) o.add(b); if (SPOUSE[b] != null && SEX[SPOUSE[b]] === s) o.add(SPOUSE[b]); } return [...o]; };
  const nn = (p, s) => { const o = new Set(), ss = sibs(p).concat(SPOUSE[p] != null ? sibs(SPOUSE[p]) : []); for (const b of ss) for (const c of kids(b)) if (SEX[c] === s) o.add(c); return [...o]; };
  const F = [(p) => (PAR[p] ? [PAR[p][0]] : []), (p) => (PAR[p] ? [PAR[p][1]] : []), (p) => (SEX[p] === 'f' && SPOUSE[p] != null ? [SPOUSE[p]] : []), (p) => (SEX[p] === 'm' && SPOUSE[p] != null ? [SPOUSE[p]] : []),
    (p) => kids(p).filter((c) => SEX[c] === 'm'), (p) => kids(p).filter((c) => SEX[c] === 'f'), (p) => ua(p, 'm'), (p) => ua(p, 'f'),
    (p) => sibs(p).filter((c) => SEX[c] === 'm'), (p) => sibs(p).filter((c) => SEX[c] === 'f'), (p) => nn(p, 'm'), (p) => nn(p, 'f')];
  const out = []; for (let fam = 0; fam < 2; fam++) for (let p = 0; p < 12; p++) F.forEach((g, r) => { const a = g(p); if (a.length) out.push([p + 12 * fam, r, a.map((q) => q + 12 * fam)]); });
  return out;
})();
/** Family-trees network: person (24, one-hot) → 6 units, relation (12) → 6 units, → 12 → 6 → 24 (softmax). Logistic hidden units, Adam. */
function famInit(seed) {
  const r = rand(hashStr('fam|' + seed)), U = (n, s) => Float64Array.from({ length: n }, () => r.uniform(-s, s));
  const P = { Ep: U(144, 1), Er: U(72, 1), b1: U(12, 0), W2: U(144, 1), b2: U(12, 0), W3: U(72, 1), b3: U(6, 0), W4: U(144, 1), b4: U(24, 0) };
  const test = []; while (test.length < 4) { const i = Math.floor(r() * TRIPLES.length); if (!test.includes(i)) test.push(i); }
  const Z = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, new Float64Array(v.length)]));
  return { P, G: Z(P), M: Z(P), S: Z(P), t: 0, epoch: 0, test, hist: [], acc: [], ws: { a1: new Float64Array(12), a2: new Float64Array(12), a3: new Float64Array(6), y: new Float64Array(24), d4: new Float64Array(24), d3: new Float64Array(6), d2: new Float64Array(12), d1: new Float64Array(12) } };
}
function famForward(st, p, r) {
  const { P, ws } = st, { a1, a2, a3, y } = ws;
  for (let j = 0; j < 6; j++) { a1[j] = sigm(P.Ep[p * 6 + j] + P.b1[j]); a1[6 + j] = sigm(P.Er[r * 6 + j] + P.b1[6 + j]); }
  for (let i = 0; i < 12; i++) { let s = P.b2[i]; for (let j = 0; j < 12; j++) s += P.W2[i * 12 + j] * a1[j]; a2[i] = sigm(s); }
  for (let i = 0; i < 6; i++) { let s = P.b3[i]; for (let j = 0; j < 12; j++) s += P.W3[i * 12 + j] * a2[j]; a3[i] = sigm(s); }
  let mx = -1e9; for (let i = 0; i < 24; i++) { let s = P.b4[i]; for (let j = 0; j < 6; j++) s += P.W4[i * 6 + j] * a3[j]; y[i] = s; if (s > mx) mx = s; }
  let Zs = 0; for (let i = 0; i < 24; i++) { y[i] = Math.exp(y[i] - mx); Zs += y[i]; } for (let i = 0; i < 24; i++) y[i] /= Zs;
  return y;
}
function famEpoch(st, lr = 0.02, wd = 1e-4) {
  const { P, G, M, S, ws } = st, { a1, a2, a3, y, d4, d3, d2, d1 } = ws; for (const k in G) G[k].fill(0);
  let L = 0, n = 0;
  TRIPLES.forEach(([p, r, ans], idx) => {
    if (st.test.includes(idx)) return; n++;
    famForward(st, p, r);
    for (let i = 0; i < 24; i++) { const tg = ans.includes(i) ? 1 / ans.length : 0; d4[i] = y[i] - tg; if (tg) L -= tg * Math.log(y[i]); }
    for (let i = 0; i < 24; i++) { G.b4[i] += d4[i]; for (let j = 0; j < 6; j++) G.W4[i * 6 + j] += d4[i] * a3[j]; }
    for (let j = 0; j < 6; j++) { let s = 0; for (let i = 0; i < 24; i++) s += P.W4[i * 6 + j] * d4[i]; d3[j] = s * a3[j] * (1 - a3[j]); }
    for (let i = 0; i < 6; i++) { G.b3[i] += d3[i]; for (let j = 0; j < 12; j++) G.W3[i * 12 + j] += d3[i] * a2[j]; }
    for (let j = 0; j < 12; j++) { let s = 0; for (let i = 0; i < 6; i++) s += P.W3[i * 12 + j] * d3[i]; d2[j] = s * a2[j] * (1 - a2[j]); }
    for (let i = 0; i < 12; i++) { G.b2[i] += d2[i]; for (let j = 0; j < 12; j++) G.W2[i * 12 + j] += d2[i] * a1[j]; }
    for (let j = 0; j < 12; j++) { let s = 0; for (let i = 0; i < 12; i++) s += P.W2[i * 12 + j] * d2[i]; d1[j] = s * a1[j] * (1 - a1[j]); }
    for (let j = 0; j < 6; j++) { G.Ep[p * 6 + j] += d1[j]; G.b1[j] += d1[j]; G.Er[r * 6 + j] += d1[6 + j]; G.b1[6 + j] += d1[6 + j]; }
  });
  st.t++;
  for (const k in P) { const p = P[k], g = G[k], m = M[k], s = S[k], dec = k[0] === 'W' || k[0] === 'E'; for (let i = 0; i < p.length; i++) { const gi = g[i] / n + (dec ? wd * p[i] : 0); m[i] = 0.9 * m[i] + 0.1 * gi; s[i] = 0.999 * s[i] + 0.001 * gi * gi; p[i] -= (lr * (m[i] / (1 - 0.9 ** st.t))) / (Math.sqrt(s[i] / (1 - 0.999 ** st.t)) + 1e-8); } }
  st.epoch++; st.hist.push(L / n);
}
/** Is triple idx answered correctly (the top-k outputs are exactly the k correct people)? */
function famCorrect(st, idx) { const [p, r, ans] = TRIPLES[idx], y = famForward(st, p, r), ord = Array.from(y.keys()).sort((a, b) => y[b] - y[a]).slice(0, ans.length); return ord.every((k) => ans.includes(k)); }
/** Tree positions (x, y) of the 12 people of one family. */
const TREE_POS = [[1, 3], [2.2, 3], [4.6, 3], [5.8, 3], [0, 2], [1.1, 2], [2.4, 2], [3.6, 2], [4.9, 2], [6, 2], [2.4, 1], [3.6, 1]];

// ---------------------------------------------------------------- 3.11: the symmetry problem
const SYM = (() => { const P = []; for (let m = 0; m < 64; m++) { const x = [0, 1, 2, 3, 4, 5].map((k) => (m >> k) & 1); P.push([x, x[0] === x[5] && x[1] === x[4] && x[2] === x[3] ? 1 : 0]); } return P; })();
function symInit(seed) { const r = rand(hashStr('sym|' + seed)); return { W1: [0, 1].map(() => Array.from({ length: 7 }, () => r.uniform(-0.3, 0.3))), W2: Array.from({ length: 3 }, () => r.uniform(-0.3, 0.3)), dW1: [0, 1].map(() => new Array(7).fill(0)), dW2: [0, 0, 0], sweep: 0, hist: [], done: null }; }
function symOut(st, x) { const h = st.W1.map((w) => sigm(w[6] + x.reduce((a, xi, i) => a + w[i] * xi, 0))); return { h, y: sigm(st.W2[2] + st.W2[0] * h[0] + st.W2[1] * h[1]) }; }
/** One sweep through all 64 patterns: accumulate ∂E/∂w, then Δw(t) = −ε ∂E/∂w + α Δw(t−1) (the paper's rule, ε = 0.1, α = 0.9). */
function symSweep(st, eps = 0.1, alpha = 0.9) {
  const g1 = [0, 1].map(() => new Array(7).fill(0)), g2 = [0, 0, 0]; let E = 0, worst = 0;
  for (const [x, d] of SYM) {
    const { h, y } = symOut(st, x); E += 0.5 * (y - d) ** 2; worst = Math.max(worst, Math.abs(y - d));
    const dy = (y - d) * y * (1 - y); g2[0] += dy * h[0]; g2[1] += dy * h[1]; g2[2] += dy;
    for (let j = 0; j < 2; j++) { const dh = dy * st.W2[j] * h[j] * (1 - h[j]); for (let i = 0; i < 6; i++) g1[j][i] += dh * x[i]; g1[j][6] += dh; }
  }
  st.hist.push(E); st.worst = worst;
  if (worst < 0.3 && st.done == null) st.done = st.sweep;
  for (let j = 0; j < 2; j++) for (let i = 0; i < 7; i++) { st.dW1[j][i] = -eps * g1[j][i] + alpha * st.dW1[j][i]; st.W1[j][i] += st.dW1[j][i]; }
  for (let i = 0; i < 3; i++) { st.dW2[i] = -eps * g2[i] + alpha * st.dW2[i]; st.W2[i] += st.dW2[i]; }
  st.sweep++;
}

export default {
  collection: 'deep',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Method',
      name: 'Gradient checking by finite differences',
      statement: String.raw`To test a hand-written or automatic gradient $g\approx\nabla f(\theta)$, compare each component with a difference quotient: the forward difference $\frac{f(\theta+he_i)-f(\theta)}{h}$ or, better, the central difference $\frac{f(\theta+he_i)-f(\theta-he_i)}{2h}$, through the relative error $\frac{|g_i-\mathrm{fd}_i|}{\max(|g_i|,|\mathrm{fd}_i|)}$. In floating-point arithmetic with unit roundoff $u$ ($2^{-53}\approx1.1\times10^{-16}$ in double, $2^{-24}\approx6\times10^{-8}$ in single precision), the error of the central difference behaves like
$$\underbrace{\tfrac{|f'''|}{6}h^2}_{\text{truncation}}+\underbrace{\tfrac{u\,|f|}{h}}_{\text{rounding}},$$
minimised near $h^\ast\approx(3u|f|/|f'''|)^{1/3}$ with error $\approx u^{2/3}$ (about $10^{-10}$–$10^{-11}$ in double); for the forward difference $h^\ast\sim\sqrt u$ and the best error $\sim\sqrt u$. A correct gradient therefore traces a **V** on log–log axes, while a wrong one shows a **flat floor** of disagreement that no step size removes.`,
      idea: String.raw`Taylor's theorem with remainder (pma-5.15) gives $f(\theta\pm h)=f\pm hf'+\tfrac{h^2}2f''\pm\tfrac{h^3}6f'''+\dots$, so the even terms cancel in the central difference and the error is $O(h^2)$, against $O(h)$ for the forward difference. But each evaluation of $f$ carries a rounding error of size about $u|f|$, and dividing a difference of two such numbers by $2h$ amplifies it to $u|f|/h$: below $h^\ast$ subtractive cancellation dominates and the error *rises* as $h$ shrinks. A bug in a local derivative (here: using $1-y$ instead of $1-y^2$ for $\tanh$) is an $O(1)$ error that sits under both branches of the V. Because the bug only affects parameters upstream of the faulty layer, checking all components localises it.`,
      caption: String.raw`Left: relative error of the central (blue) and forward (orange) differences against the step $h$, for one parameter of a $2$–$3$–$3$–$1$ tanh network, with the predicted truncation-plus-rounding curves dashed (the derivatives $f''$, $f'''$ estimated from the gradient itself). Switch to *single precision* — every operation rounded with Math.fround — and the V moves up and to the right. Switch to the *buggy backprop* and the curve flattens. Right: all 25 parameters at the predicted best step, coloured by layer; click a bar to plot that parameter. With the bug, only the output layer passes.`,
      deps: ['deep-3.3', 'pma-5.15'],
      refs: ['Goodfellow §11.5'],
      tags: ['gradient checking', 'finite differences', 'floating point'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Numerical_differentiation' },
      viz(v) {
        const precS = v.select('precision', [{ value: 64, label: 'double (float64)' }, { value: 32, label: 'single (float32)' }], 64);
        const bugS = v.select('backprop', [{ value: 'ok', label: 'correct' }, { value: 'tanh', label: "buggy: tanh′ = 1 − y" }], 'ok');
        const iS = v.slider('parameter $i$', 1, GC_THETA.length, 4, { int: true });
        const sE = v.stage({ x: [1e-14, 1], y: [1e-16, 10], xlog: true, ylog: true, height: 330, axes: 'box', gutter: true, xlabel: 'step $h$', ylabel: 'relative error', weight: 1.2, minWidth: 320, title: 'error of the difference quotient against $h$' });
        const sB = v.stage({ x: [0.3, GC_THETA.length + 0.7], y: [1e-14, 10], ylog: true, height: 330, axes: 'box', gutter: true, xlabel: 'parameter (layer 1 · 2 · 3)', weight: 0.9, minWidth: 260, title: 'every parameter at the best step $h^\\ast$' });
        const LC = ['accent', 'purple', 'green'];
        sB.onClick((x) => { const k = Math.round(x); if (k >= 1 && k <= GC_THETA.length) iS.set(k); });
        const HS = []; for (let k = 0; k <= 56; k++) HS.push(10 ** (-14 + k / 4));
        const comp = memo(), curves = memo();
        let info = null;
        v.render(() => {
          const prec = precS.value, bug = bugS.value === 'tanh' ? 'tanh' : null, rnd = prec === 32 ? Math.fround : null, u = prec === 32 ? 2 ** -24 : 2 ** -53;
          const base = comp(prec + '|' + bug, () => {
            const th = rnd ? Float64Array.from(GC_THETA, rnd) : GC_THETA;
            const R = gcLoss(th, { round: rnd, bug }), adj = R.T.backward(R.L), g = R.P.map((p) => adj[p]);
            const f0 = R.T.val(R.L), L = (t) => gcLoss(t, { round: rnd }).T.v.at(-1);
            const exact = (() => { const E = gcLoss(GC_THETA), a = E.T.backward(E.L); return E.P.map((p) => a[p]); })();
            // second and third derivative along each coordinate from the (correct, float64) gradient
            const d2 = [], d3 = [];
            for (let i = 0; i < GC_THETA.length; i++) {
              const gi = (dl) => { const t = Float64Array.from(GC_THETA); t[i] += dl; const E = gcLoss(t), a = E.T.backward(E.L); return a[E.P[i]]; };
              const dl = 1e-3, gp = gi(dl), gm = gi(-dl); d2.push((gp - gm) / (2 * dl)); d3.push((gp - 2 * exact[i] + gm) / (dl * dl));
            }
            const hstar = d3.map((t) => Math.min(0.1, Math.cbrt((3 * u * Math.abs(f0)) / Math.max(1e-12, Math.abs(t)))));
            const errAt = (i, h, central = true) => { const tp = Float64Array.from(th), tm = Float64Array.from(th); tp[i] = th[i] + h; tm[i] = th[i] - h; const fp = L(tp), fm = central ? L(tm) : f0, fd = central ? (fp - fm) / (2 * h) : (fp - f0) / h; return Math.min(1, Math.abs(fd - g[i]) / Math.max(1e-300, Math.abs(fd), Math.abs(g[i]))); };
            const bars = g.map((_, i) => errAt(i, hstar[i]));
            return { th, g, f0, d2, d3, hstar, errAt, bars, ops: R.T.fops };
          });
          const i = iS.value - 1;
          const C = curves(prec + '|' + bug + '|' + i, () => HS.map((h) => [h, base.errAt(i, h, true), base.errAt(i, h, false)]));
          const gi = Math.abs(base.g[i]) || 1e-300, f0 = Math.abs(base.f0);
          // rule-of-thumb band and predictions
          sE.hband(1e-16, prec === 64 ? 1e-7 : 1e-3, { color: 'green', alpha: 0.07 });
          sE.fn((h) => Math.min(10, (Math.abs(base.d3[i]) * h * h / 6 + (u * f0) / h) / gi), { color: 'accent', width: 1.2, dash: [5, 4], alpha: 0.8 });
          sE.fn((h) => Math.min(10, (Math.abs(base.d2[i]) * h / 2 + (2 * u * f0) / h) / gi), { color: 'orange', width: 1.2, dash: [5, 4], alpha: 0.8 });
          const fl = (e) => Math.max(e, 1.1e-16);
          sE.path(C.map((c) => [c[0], fl(c[2])]), { color: 'orange', width: 1.8 }); sE.dots(C.map((c) => [c[0], fl(c[2])]), { r: 2.4, color: 'orange' });
          sE.path(C.map((c) => [c[0], fl(c[1])]), { color: 'accent', width: 2.2 }); sE.dots(C.map((c) => [c[0], fl(c[1])]), { r: 2.8, color: 'accent' });
          let best = C[0]; for (const c of C) if (c[1] < best[1]) best = c;
          sE.vline(base.hstar[i], { color: 'gold', width: 1.4, dash: [4, 3] });
          sE.text('h* predicted', base.hstar[i], 3, { dx: 5, align: 'left', size: 11.5, color: 'gold', weight: 600 });
          // bars
          sB.hband(1e-14, prec === 64 ? 1e-7 : 1e-3, { color: 'green', alpha: 0.07 });
          base.bars.forEach((e, k) => { const col = LC[GC_ROLE[k].l]; sB.rect(k + 1 - 0.36, 1e-14, k + 1 + 0.36, fl(e), { fill: col, fillAlpha: k === i ? 0.85 : 0.45, color: col, width: k === i ? 2 : 1 }); });
          sB.text('pass', GC_THETA.length + 0.5, prec === 64 ? 1e-7 : 1e-3, { align: 'right', dy: 10, size: 11, color: 'green', weight: 600 });
          const passing = base.bars.filter((e) => e < (prec === 64 ? 1e-7 : 1e-3)).length, role = GC_ROLE[i];
          info = { i, role, best, hstar: base.hstar[i], errStar: base.bars[i], g: base.g[i], passing, prec, bug, ops: base.ops };
        });
        v.legend([['accent', 'central difference'], ['orange', 'forward difference'], ['muted', 'predicted $\\frac{|f\'\'\'|h^2}{6}+\\frac{u|f|}{h}$ (and forward analogue)', { dash: true }], ['green', 'typical pass region', { area: true }]]);
        v.readout(() => info && String.raw`parameter ${info.i + 1} (layer ${info.role.l + 1}, ${info.role.r === 'w' ? `weight $w_{${info.role.i + 1}${info.role.j + 1}}$` : `bias $b_{${info.role.i + 1}}$`}): backprop $\partial L/\partial\theta_i=${tsci(info.g, 6)}$ · smallest central-difference error $${tsci(info.best[1], 2)}$ at $h=${tsci(info.best[0], 1)}$, predicted $h^\ast=${tsci(info.hstar, 1)}$ (theory: error $\approx u^{2/3}=${tsci((info.prec === 64 ? 2 ** -53 : 2 ** -24) ** (2 / 3), 1)}$) · **${info.passing} of ${GC_THETA.length}** parameters pass` + (info.bug ? ' — the failures are exactly the parameters upstream of a tanh layer' : ''));
      },
    },
    // ───────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Algorithm',
      name: 'Backpropagation through time',
      statement: String.raw`A recurrent network $h_t=\phi(a_t)$, $a_t=W h_{t-1}+Ux_t+b$ ($t=1,\dots,T$, $h_0$ given) with loss $L=\sum_t\ell_t(h_t)$ is differentiated by **unrolling** it into a feedforward graph of depth $T$ in which every step reuses the same parameters, and running reverse mode (3.3) on that graph: with $\delta_t=\partial L/\partial h_t$,
$$\delta_T=\ell_T'(h_T),\qquad \delta_t=\ell_t'(h_t)+W^{\top}\bigl(\phi'(a_{t+1})\odot\delta_{t+1}\bigr),\qquad \frac{\partial L}{\partial W}=\sum_{t=1}^T\bigl(\phi'(a_t)\odot\delta_t\bigr)h_{t-1}^{\top},$$
and similarly for $U$ and $b$; the shared weight's gradient is the **sum of per-step contributions**. Memory is $O(T)$ (all states stored); *truncated* BPTT cuts the sum after $k$ steps. The signal from step $T$ reaching step $t$ is multiplied by $\prod_{s=t+1}^{T}W^\top\operatorname{diag}\phi'(a_s)$, so it **vanishes** exponentially in $T-t$ when these factors have norm below $1$ and **explodes** when above — the same mechanism that makes deep sigmoid networks hard to train.`,
      idea: String.raw`Unrolling turns the recurrence into an ordinary computational graph in which $W$ is one node with $T$ outgoing edges, so the accumulation rule of reverse mode adds up the $T$ contributions automatically. The recursion for $\delta_t$ is the chain rule along the time axis. For a scalar state the factor per step is $w\,\phi'(a_s)$: since $\tanh'\le1$ and $\sigma'\le\tfrac14$, the product decays geometrically unless $|w|$ is large, in which case it may blow up instead. Feedforward depth behaves identically except that each layer has its own weights: with sigmoid units and standard initialisation the gradient shrinks layer by layer, while ReLU with He initialisation keeps it roughly constant (5.1).`,
      caption: String.raw`Top: the network unrolled over $T$ steps, each state shaded by the size of its gradient $|\partial L/\partial h_t|$. Middle: on a log scale, $|\partial L/\partial h_t|$ (blue) and each step's contribution to $\partial L/\partial w$ (orange bars) — geometric decay is a straight line, compared with the product of the per-step factors $|w\,\phi'(a_s)|$ (dashed). Push the recurrent weight $w$ above $1$ with tanh, or use ReLU with $w>1$, and watch the gradient explode instead; with *loss at every step* nearby steps still get gradient. Right: the same story through the depth of a 30-layer feedforward network at its standard initialisation.`,
      deps: ['deep-3.3'],
      refs: ['Goodfellow §10.2'],
      tags: ['recurrent networks', 'BPTT', 'vanishing gradients'],
      credit: 'Werbos, 1990; Rumelhart, Hinton & Williams, 1986',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Backpropagation_through_time' },
      viz(v) {
        const actS = v.select('activation $\\phi$', [{ value: 'tanh', label: 'tanh' }, { value: 'sigmoid', label: 'sigmoid' }, { value: 'relu', label: 'ReLU' }, { value: 'linear', label: 'linear' }], 'tanh');
        const lossS = v.select('loss', [{ value: 'last', label: 'at the last step' }, { value: 'all', label: 'at every step' }], 'last');
        const wS = v.slider('recurrent weight $w$', -2.5, 2.5, 0.9, { step: 0.01 });
        const TS = v.slider('steps $T$', 5, 60, 40, { int: true });
        const sU = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 120, full: true, title: 'unrolled graph: $h_{t}=\\phi(w\\,h_{t-1}+x_t+b)$, shaded by $|\\partial L/\\partial h_t|$' });
        const sG = v.stage({ x: [0.5, 60.5], y: [1e-12, 1e6], ylog: true, height: 280, axes: 'box', gutter: true, xlabel: 'time step $t$', weight: 1.25, minWidth: 320, title: 'gradient through time' });
        const sD = v.stage({ x: [0.5, 30.5], y: [1e-16, 1e2], ylog: true, height: 280, axes: 'box', gutter: true, xlabel: 'layer $\\ell$ (30 = output side)', weight: 0.9, minWidth: 250, title: 'through depth: $\\lVert\\partial L/\\partial z_\\ell\\rVert$' });
        const ACT = { tanh: [Math.tanh, (a, h) => 1 - h * h], sigmoid: [sigm, (a, h) => h * (1 - h)], relu: [(a) => (a > 0 ? a : 0), (a) => (a > 0 ? 1 : 0)], linear: [(a) => a, () => 1] };
        const xs = (() => { const r = rand(hashStr('bptt-x')); return Array.from({ length: 61 }, (_, t) => 0.45 * Math.sin(t / 2.3) + 0.35 * r.normal()); })();
        const B = 0.1, ytgt = (t) => 0.4 * Math.cos(t / 3);
        const run = (w, T, act, mode) => {
          const [f, df] = ACT[act], a = [0], h = [0];
          for (let t = 1; t <= T; t++) { a[t] = w * h[t - 1] + xs[t] + B; h[t] = f(a[t]); }
          let L = 0; const dl = (t) => (mode === 'all' || t === T ? h[t] - (mode === 'all' ? ytgt(t) : 0.5) : 0);
          for (let t = 1; t <= T; t++) if (mode === 'all' || t === T) L += 0.5 * (h[t] - (mode === 'all' ? ytgt(t) : 0.5)) ** 2;
          const delta = new Array(T + 2).fill(0), contrib = new Array(T + 1).fill(0), fac = new Array(T + 2).fill(0);
          for (let t = T; t >= 1; t--) { delta[t] = dl(t) + (t < T ? w * df(a[t + 1], h[t + 1]) * delta[t + 1] : 0); fac[t] = w * df(a[t], h[t]); contrib[t] = delta[t] * df(a[t], h[t]) * h[t - 1]; }
          return { L, h, a, delta, contrib, fac, gw: contrib.reduce((s, c) => s + c, 0) };
        };
        const depth = memo();
        let info = null;
        v.render(() => {
          const w = wS.value, T = TS.value, act = actS.value, mode = lossS.value, R = run(w, T, act, mode);
          const fd = (run(w + 1e-6, T, act, mode).L - run(w - 1e-6, T, act, mode).L) / 2e-6;
          // unrolled chain
          const lg = (d) => Math.log10(Math.max(1e-14, Math.abs(d))), mx = Math.max(...R.delta.slice(1, T + 1).map(lg)), mn = mx - 10;
          const X = (t) => 0.035 + (0.88 * (t - 0.5)) / T, rr = Math.min(9, (sU.width * 0.88) / T / 2.6);
          for (let t = 1; t <= T; t++) {
            if (t < T) sU.line(X(t), 0.62, X(t + 1), 0.62, { color: 'muted', width: 1.2 });
            sU.line(X(t), 0.2, X(t), 0.62, { color: 'faint', width: 1 });
            const k = clamp((lg(R.delta[t]) - mn) / (mx - mn || 1), 0, 1);
            sU.dot(X(t), 0.62, { r: rr, color: v.ramp(0.15 + 0.85 * k, 'accent') }); sU.dot(X(t), 0.62, { r: rr, hollow: true, color: 'ink', width: 1, alpha: 0.6 });
            sU.dot(X(t), 0.2, { r: Math.max(2, rr * 0.45), color: 'muted' });
            if (mode === 'all' || t === T) sU.line(X(t), 0.62, X(t), 0.86, { color: 'red', width: 1, alpha: 0.6 });
          }
          sU.text('L', 0.955, 0.62, { size: 14, color: 'red', weight: 700, align: 'center' }); sU.line(X(T) + 0.008, 0.62, 0.94, 0.62, { color: 'red', width: 1.4 });
          sU.text('x_t', X(1), 0.2, { dx: -rr - 4, align: 'right', size: 11, color: 'muted' }); sU.text('h_t', X(1), 0.62, { dx: -rr - 4, align: 'right', size: 11, color: 'muted' });
          // gradient through time
          sG.setView([0.5, T + 0.5], [1e-12, 1e6]);
          const fl = (z) => Math.max(1.2e-12, Math.abs(z));
          for (let t = 1; t <= T; t++) sG.rect(t - 0.32, 1e-12, t + 0.32, fl(R.contrib[t]), { fill: 'orange', fillAlpha: 0.45, color: 'orange', width: 1 });
          sG.path(Array.from({ length: T }, (_, k) => [k + 1, fl(R.delta[k + 1])]), { color: 'accent', width: 2.2 });
          sG.dots(Array.from({ length: T }, (_, k) => [k + 1, fl(R.delta[k + 1])]), { r: 3, color: 'accent' });
          if (mode === 'last') { const pr = []; let p = Math.abs(R.delta[T]); for (let t = T; t >= 1; t--) { pr.push([t, fl(p)]); p *= Math.abs(R.fac[t]); } sG.path(pr, { color: 'ink', width: 1.2, dash: [4, 4], alpha: 0.8 }); }
          // depth panel: 30-layer MLPs at standard initialisation (one sample, squared error)
          const D = depth('d', () => {
            const out = {}; const x = [0.6, -0.4, 0.3, 0.8, -0.7, 0.1, 0.5, -0.2];
            for (const a of ['sigmoid', 'tanh', 'relu']) {
              const net = makeNet([8, ...new Array(29).fill(24), 1], { act: a, seed: 11 });
              lossGrad(net, [x], [0.5], 'mse', { W: net.W.map((w) => new Float64Array(w.length)), b: net.b.map((u) => new Float64Array(u.length)) });
              out[a] = Array.from({ length: 29 }, (_, k) => { const d = net.ws.d[k + 1]; let s = 0; for (const z of d) s += z * z; return [k + 1, Math.max(1e-16, Math.sqrt(s))]; });
              const dL = net.ws.d[30]; out[a].push([30, Math.max(1e-16, Math.abs(dL[0]))]);
            }
            return out;
          });
          const DC = { sigmoid: 'purple', tanh: 'teal', relu: 'green' };
          for (const a of ['sigmoid', 'tanh', 'relu']) { const on = a === act; sD.path(D[a], { color: DC[a], width: on ? 3 : 1.6, alpha: on || act === 'linear' ? 1 : 0.55 }); sD.text(a === 'relu' ? 'ReLU (He)' : a + ' (Xavier)', 1.2, D[a][0][1], { dy: a === 'sigmoid' ? 12 : -9, size: 11.5, color: DC[a], weight: 600 }); }
          const span = Math.abs(R.delta[1]) / Math.max(1e-300, Math.abs(R.delta[T]));
          const facs = R.fac.slice(2, T + 1).map(Math.abs), gm = Math.exp(facs.reduce((s, q) => s + Math.log(Math.max(q, 1e-300)), 0) / Math.max(1, facs.length));
          info = { gw: R.gw, fd, span, gm, mode, D, act };
        });
        v.legend([['accent', '$|\\partial L/\\partial h_t|$'], ['orange', 'contribution of step $t$ to $\\partial L/\\partial w$'], ['ink', 'product of factors $|w\\,\\phi\'(a_s)|$', { dash: true }]]);
        v.readout(() => info && String.raw`BPTT: $\partial L/\partial w=${tsci(info.gw, 6)}$, central difference $${tsci(info.fd, 6)}$ · geometric-mean factor per step $|w\,\phi'(a_s)|=${info.gm.toFixed(3)}$ · $|\partial L/\partial h_1|\,/\,|\partial L/\partial h_T|=${tsci(info.span, 2)}$` + (info.mode === 'last' ? (info.span < 1e-3 ? ' — **vanishing**: early inputs barely affect the gradient' : info.span > 1e3 ? ' — **exploding**' : '') : '') +
          ` · depth 30 at initialisation: input-side / output-side gradient ratio sigmoid $${tsci(info.D.sigmoid[0][1] / info.D.sigmoid[28][1], 1)}$, tanh $${tsci(info.D.tanh[0][1] / info.D.tanh[28][1], 1)}$, ReLU $${tsci(info.D.relu[0][1] / info.D.relu[28][1], 1)}$`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Method',
      name: 'Gradient checkpointing',
      statement: String.raw`Reverse mode on a chain of $n$ layers normally stores all $n$ intermediate activations. **Checkpointing** stores only a subset $C$ (the *checkpoints*) during the forward pass; during the backward pass, each segment between consecutive checkpoints is **recomputed** from its left checkpoint, back-propagated through, and freed. With $k$ evenly spaced checkpoints the peak memory is about $k+n/k$ activations and the extra work is one more forward pass over the non-checkpointed layers ($\approx n-k$ layer evaluations), so $k\approx\sqrt n$ gives memory $O(\sqrt n)$ for about $33\%$ more computation (forward + recompute + backward $\approx 3n$ instead of $2n$ layer-equivalents, counting a backward step as one). The gradient is **bit-for-bit identical**, because exactly the same arithmetic is redone. Recursive schedules (Griewank's *revolve*) reach $O(\log n)$ memory with $O(n\log n)$ work.`,
      idea: String.raw`The backward pass through layer $i$ needs the activations entering and leaving it (3.3); anything else can be thrown away and recomputed when needed, since the forward computation is deterministic. Splitting the chain into $k$ segments, the forward pass keeps $k$ checkpoints, and at any moment of the backward pass only one segment's $\approx n/k$ activations are live, so the peak is $k+n/k$, minimised at $k=\sqrt n$ by AM–GM. Each layer is recomputed at most once, so the time overhead is bounded by one forward pass.`,
      caption: String.raw`Top: a chain of $n$ layers; green cells are checkpoints, blue cells are activations currently held in memory, gold is the layer being computed in the forward pass, orange a recomputation, purple the backward pass. Step through the schedule or press play. Middle: memory in use over the schedule, with its peak. Right: for every number $k$ of evenly spaced checkpoints, the peak memory (blue) and the recomputation (orange); $\sqrt n$ is marked. Choose $k$ with the slider, or click cells to place checkpoints by hand. The readout runs the schedule on real tanh layers and compares the gradient with plain backprop.`,
      deps: ['deep-3.3'],
      refs: ['Prince §7'],
      tags: ['memory', 'backpropagation'],
      credit: 'Griewank, 1992; Chen, Xu, Zhang & Guestrin, 2016',
      viz(v) {
        const nS = v.slider('layers $n$', 8, 64, 36, { int: true, onChange: () => { custom = null; S.reset({ at: 'start' }); } });
        const kS = v.slider('checkpoints $k$ (evenly spaced)', 1, 64, 6, { int: true, onChange: () => { custom = null; S.reset({ at: 'keep' }); } });
        let custom = null;                                   // Set of checkpoint indices placed by clicking
        const sC = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 120, full: true, title: 'the chain: activations $a_0,\\dots,a_n$ (click to toggle a checkpoint)' });
        const sM = v.stage({ x: [0, 100], y: [0, 70], height: 250, axes: 'box', gutter: true, xlabel: 'schedule step', ylabel: 'activations in memory', weight: 1.1, minWidth: 300, title: 'memory over the schedule' });
        const sT = v.stage({ x: [1, 64], y: [0, 70], height: 250, axes: 'box', gutter: true, xlabel: 'checkpoints $k$', weight: 0.9, minWidth: 260, title: 'the trade-off' });
        const ckpts = () => { const n = nS.value; if (custom) return [...custom].filter((c) => c < n).sort((a, b) => a - b); const k = Math.min(kS.value, n); const s = new Set(); for (let j = 0; j < k; j++) s.add(Math.round((j * n) / k)); return [...s].sort((a, b) => a - b); };
        /** Simulate the schedule: events with the set of held activations after each one. */
        const schedule = (n, C) => {
          const isC = new Set(C), held = new Set([0]), ev = []; let re = 0;
          const snap = (type, i) => ev.push({ type, i, held: new Set(held), mem: held.size });
          for (let i = 1; i <= n; i++) { held.add(i); if (i - 1 > 0 && !isC.has(i - 1)) held.delete(i - 1); snap('fwd', i); }
          const segs = C.concat([n]);
          for (let j = segs.length - 2; j >= 0; j--) {
            const c0 = segs[j], c1 = segs[j + 1];
            for (let i = c0 + 1; i < c1; i++) { held.add(i); re++; snap('re', i); }
            for (let i = c1; i > c0; i--) { held.delete(i); snap('bwd', i); }
          }
          return { ev, peak: Math.max(...ev.map((e) => e.mem)), re };
        };
        const S = v.steps({ frames: () => schedule(nS.value, ckpts()).ev.map((e) => ({ ...e, note: e.type === 'fwd' ? `Forward: compute $a_{${e.i}}$` + (e.i > 1 && !e.held.has(e.i - 1) ? `, discard $a_{${e.i - 1}}$.` : '.') : e.type === 're' ? `Recompute $a_{${e.i}}$ from the last checkpoint.` : `Backward through layer ${e.i}: needs $a_{${e.i - 1}}$ and $a_{${e.i}}$; then free $a_{${e.i}}$.` })), speed: 8, still: 60 });
        sC.onClick((x) => { const n = nS.value, i = Math.round(((x - 0.03) / 0.94) * n); if (i < 1 || i >= n) return; if (!custom) custom = new Set(ckpts()); if (custom.has(i)) custom.delete(i); else custom.add(i); custom.add(0); S.reset({ at: 'keep' }); });
        /** Run the schedule on real tanh layers (width 6) and compare ∂L/∂a₀ with plain backprop. */
        const realCheck = (n, C) => {
          const r = rand(hashStr('ckpt|' + n)), d = 6, W = Array.from({ length: n }, () => Array.from({ length: d * d }, () => r.normal() * 0.9 / Math.sqrt(d))), a0 = Array.from({ length: d }, () => r.normal());
          const layer = (i, a) => Array.from({ length: d }, (_, p) => { let s = 0; for (let q = 0; q < d; q++) s += W[i - 1][p * d + q] * a[q]; return Math.tanh(s); });
          const back = (i, ain, aout, g) => { const gz = g.map((x, p) => x * (1 - aout[p] * aout[p])); return Array.from({ length: d }, (_, q) => { let s = 0; for (let p = 0; p < d; p++) s += W[i - 1][p * d + q] * gz[p]; return s; }); };
          // plain: store everything
          const A = [a0]; for (let i = 1; i <= n; i++) A.push(layer(i, A[i - 1]));
          let g = A[n].slice(); for (let i = n; i >= 1; i--) g = back(i, A[i - 1], A[i], g);
          // checkpointed: forward keeps only checkpoints (and a_n), backward recomputes each segment
          const store = new Map([[0, a0]]); let a = a0; for (let i = 1; i <= n; i++) { a = layer(i, a); if (C.includes(i) || i === n) store.set(i, a); }
          let g2 = store.get(n).slice(); const segs = C.concat([n]);
          for (let j = segs.length - 2; j >= 0; j--) { const c0 = segs[j], c1 = segs[j + 1], seg = new Map([[c0, store.get(c0)]]); for (let i = c0 + 1; i < c1; i++) seg.set(i, layer(i, seg.get(i - 1))); seg.set(c1, store.get(c1)); for (let i = c1; i > c0; i--) g2 = back(i, seg.get(i - 1), seg.get(i), g2); }
          return Math.max(...g.map((x, p) => Math.abs(x - g2[p])));
        };
        const tradeoff = memo(), check = memo();
        let info = null;
        v.render(() => {
          const n = nS.value, C = ckpts(), Sch = schedule(n, C), F = S.frame, isC = new Set(C);
          kS.el.style.opacity = custom ? 0.5 : 1;
          // the chain
          const X = (i) => 0.03 + (0.94 * i) / n, w = Math.min(0.94 / (n + 1) * 0.42, 0.02), y0 = 0.3, y1 = 0.72;
          for (let i = 0; i <= n; i++) {
            const held = F.held && F.held.has(i), cur = F.i === i;
            const col = cur ? (F.type === 'fwd' ? 'gold' : F.type === 're' ? 'orange' : 'purple') : isC.has(i) && held ? 'green' : held ? 'accent' : null;
            sC.rect(X(i) - w, y0, X(i) + w, y1, { fill: col || 'panel', fillAlpha: col ? (held || cur ? 0.75 : 0.3) : 1, color: isC.has(i) ? 'green' : 'muted', width: isC.has(i) ? 2.2 : 1, radius: 3 });
            if (F.type === 'bwd' && i >= F.i) sC.rect(X(i) - w, y0 - 0.12, X(i) + w, y0 - 0.05, { fill: 'purple', fillAlpha: 0.6, stroke: false });
            if (n <= 40 || i % 4 === 0) sC.text(String(i), X(i), y1, { dy: -8, align: 'center', size: 10, color: 'muted' });
          }
          // memory over the schedule
          const ev = Sch.ev; sM.setView([0, ev.length], [0, Math.max(n + 2, 10)]);
          sM.path(ev.map((e, k) => [k + 1, e.mem]), { color: 'accent', width: 2 });
          sM.hline(Sch.peak, { color: 'red', width: 1.2, dash: [5, 4] }); sM.text(`peak ${Sch.peak}`, ev.length, Sch.peak, { dy: -8, dx: -4, align: 'right', size: 11.5, color: 'red', weight: 600 });
          sM.hline(n + 1, { color: 'faint', width: 1, dash: [3, 3] }); sM.text(`store all: ${n + 1}`, 1, n + 1, { dy: -8, dx: 4, size: 11, color: 'muted' });
          sM.vband(n, n + Sch.re, { color: 'orange', alpha: 0.06 });
          sM.vline(S.i + 1, { color: 'gold', width: 1.5 }); sM.dot(S.i + 1, F.mem ?? 0, { r: 5, color: 'gold' });
          // trade-off
          const TR = tradeoff(n, () => Array.from({ length: n }, (_, j) => { const k = j + 1, s = new Set(); for (let q = 0; q < k; q++) s.add(Math.round((q * n) / k)); const R = schedule(n, [...s].sort((a, b) => a - b)); return [k, R.peak, R.re]; }));
          sT.setView([1, n], [0, n + 4]);
          sT.path(TR.map((q) => [q[0], q[1]]), { color: 'accent', width: 2.2 }); sT.path(TR.map((q) => [q[0], q[2]]), { color: 'orange', width: 2.2 });
          sT.vline(Math.sqrt(n), { color: 'green', width: 1.4, dash: [4, 3] }); sT.text('√n', Math.sqrt(n), n + 4, { dx: 4, dy: 12, size: 12, color: 'green', weight: 700 });
          sT.dot(C.length, Sch.peak, { r: 6, color: 'accent' }); sT.dot(C.length, Sch.re, { r: 6, color: 'orange' });
          const best = TR.reduce((b, q) => (q[1] < b[1] ? q : b), TR[0]);
          const diff = check(n + '|' + C.join(','), () => realCheck(n, C));
          info = { n, k: C.length, peak: Sch.peak, re: Sch.re, best, diff, custom: !!custom };
        });
        v.legend([['green', 'checkpoint'], ['accent', 'held in memory'], ['gold', 'forward'], ['orange', 'recompute'], ['purple', 'backward']]);
        v.readout(() => info && String.raw`$n=${info.n}$ layers, ${info.k} checkpoint${info.k === 1 ? '' : 's'}${info.custom ? ' (placed by hand)' : ''}: peak memory **${info.peak}** activations (store-all: ${info.n + 1}), recomputed layers ${info.re}, total layer evaluations ${2 * info.n + info.re} instead of ${2 * info.n} (+${((100 * info.re) / (2 * info.n)).toFixed(0)}%) · best even spacing: $k=${info.best[0]}$ with peak ${info.best[1]} ($2\sqrt n\approx${(2 * Math.sqrt(info.n)).toFixed(1)}$) · on real tanh layers the checkpointed gradient differs from plain backprop by ${info.diff === 0 ? '**exactly 0**' : tsci(info.diff, 1)}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Method',
      name: 'Implicit differentiation through fixed points',
      statement: String.raw`Let a layer output $z^\ast(\theta)$ be defined implicitly as a fixed point $z^\ast=f(z^\ast,\theta)$ (for instance the limit of $z_{k+1}=f(z_k,\theta)$), with $f$ continuously differentiable and $I-\partial_zf(z^\ast,\theta)$ invertible. By the implicit function theorem (pma-9.28) $z^\ast$ is differentiable and
$$\frac{\partial z^\ast}{\partial\theta}=\bigl(I-\partial_zf\bigr)^{-1}\partial_\theta f ,$$
so for a loss $L(z^\ast)$ the gradient is obtained from one **adjoint linear solve**:
$$\lambda=\bigl(I-\partial_zf\bigr)^{-\top}\nabla_zL,\qquad \nabla_\theta L=(\partial_\theta f)^{\top}\lambda .$$
This needs only $z^\ast$ — not the iterates that produced it — so memory is constant in the number of iterations. Backpropagating through $K$ unrolled iterations instead costs $O(K)$ memory and converges to the same gradient as $K\to\infty$ when $f$ is a contraction in $z$, with error decaying like $\rho^K$, $\rho$ the contraction rate.`,
      idea: String.raw`Differentiate the identity $z^\ast(\theta)=f(z^\ast(\theta),\theta)$: $\dot z^\ast=\partial_zf\,\dot z^\ast+\partial_\theta f\,\dot\theta$, and solve for $\dot z^\ast$. The transpose gives the reverse-mode (VJP) version, which is what a deep-equilibrium layer uses. Unrolled backprop computes the gradient of $L(z_K)$, a different function; its derivative is a truncated Neumann series $\sum_{k<K}(\partial_zf)^k$ for $(I-\partial_zf)^{-1}$ (plus the drift of $z_K$ itself), so the gap shrinks geometrically at the contraction rate. When $f$ stops being a contraction, the iteration and the series diverge together.`,
      caption: String.raw`Left: the two-dimensional state $z$ of the layer $z\mapsto\tanh(sWz+c+b)$; the faint arrows are $f(z)-z$, the gold path is the iteration from $z_0=0$ and the green dot the fixed point. Drag the target $t$ (red); the loss is $\tfrac12\lVert z^\ast-t\rVert^2$. Right: the gap between the gradient obtained by backpropagating through $K$ unrolled iterations (a real tape, $K$ steps long) and the implicit-function-theorem gradient, on a log scale, against the predicted rate $\rho^K$. Raise the weight scale $s$: the contraction weakens, more iterations are needed, and past $\rho=1$ the iteration stops converging.`,
      deps: ['deep-3.3', 'pma-9.28'],
      refs: ['Goodfellow §6.5'],
      tags: ['implicit differentiation', 'fixed points', 'deep equilibrium'],
      credit: 'Almeida, 1987; Pineda, 1987; Bai, Kolter & Koltun, 2019',
      viz(v) {
        const sS = v.slider('weight scale $s$', 0.1, 1.8, 0.8, { step: 0.01 });
        const KS = v.slider('unrolled iterations $K$', 1, 60, 12, { int: true });
        const sZ = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, height: 340, axes: 'box', gutter: true, xlabel: '$z_1$', ylabel: '$z_2$', weight: 0.95, minWidth: 280, title: 'state space: iteration and fixed point' });
        const sE = v.stage({ x: [0.5, 60.5], y: [1e-16, 10], ylog: true, height: 340, axes: 'box', gutter: true, xlabel: 'unrolled iterations $K$', weight: 1.05, minWidth: 300, title: 'unrolled gradient − implicit gradient' });
        const Ht = sZ.handle(0.7, -0.5, { color: 'red', r: 7, label: 't' });
        const W0 = [[0.6, -1.0], [0.9, 0.4]], c = [0.35, -0.15], b0 = [0.1, 0.05];
        const fz = (z, s, b) => [Math.tanh(s * (W0[0][0] * z[0] + W0[0][1] * z[1]) + c[0] + b[0]), Math.tanh(s * (W0[1][0] * z[0] + W0[1][1] * z[1]) + c[1] + b[1])];
        const fixed = (s, b, N = 600) => { let z = [0, 0], dz = 0; for (let k = 0; k < N; k++) { const z1 = fz(z, s, b); dz = Math.hypot(z1[0] - z[0], z1[1] - z[1]); z = z1; } return { z, dz }; };
        const loss = (z, t) => 0.5 * ((z[0] - t[0]) ** 2 + (z[1] - t[1]) ** 2);
        /** Gradient of L(z*) w.r.t. (b1, b2, s) by the implicit function theorem. */
        const implicitGrad = (s, b, t) => {
          const { z, dz } = fixed(s, b), D = [1 - z[0] ** 2, 1 - z[1] ** 2];
          const J = [[D[0] * s * W0[0][0], D[0] * s * W0[0][1]], [D[1] * s * W0[1][0], D[1] * s * W0[1][1]]];
          const A = [[1 - J[0][0], -J[1][0]], [-J[0][1], 1 - J[1][1]]], r = [z[0] - t[0], z[1] - t[1]], det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
          const lam = [(A[1][1] * r[0] - A[0][1] * r[1]) / det, (-A[1][0] * r[0] + A[0][0] * r[1]) / det];
          const Wz = [W0[0][0] * z[0] + W0[0][1] * z[1], W0[1][0] * z[0] + W0[1][1] * z[1]];
          const tr = J[0][0] + J[1][1], dt = J[0][0] * J[1][1] - J[0][1] * J[1][0], disc = tr * tr - 4 * dt;
          const rho = disc >= 0 ? Math.max(Math.abs((tr + Math.sqrt(disc)) / 2), Math.abs((tr - Math.sqrt(disc)) / 2)) : Math.sqrt(Math.abs(dt));
          return { g: [D[0] * lam[0], D[1] * lam[1], lam[0] * D[0] * Wz[0] + lam[1] * D[1] * Wz[1]], z, dz, rho };
        };
        /** Gradient of L(z_K) by reverse mode through K recorded iterations; returns the gradient and the tape length. */
        const unrolledGrad = (s, b, t, K) => {
          const T = new Tape(), b1 = T.input(b[0]), b2 = T.input(b[1]), sv = T.input(s); let z1 = T.input(0), z2 = T.input(0);
          for (let k = 0; k < K; k++) {
            const u1 = T.addc(T.add(T.mul(sv, T.add(T.mulc(z1, W0[0][0]), T.mulc(z2, W0[0][1]))), b1), c[0]);
            const u2 = T.addc(T.add(T.mul(sv, T.add(T.mulc(z1, W0[1][0]), T.mulc(z2, W0[1][1]))), b2), c[1]);
            z1 = T.tanh(u1); z2 = T.tanh(u2);
          }
          const L = T.mulc(T.add(T.sqr(T.addc(z1, -t[0])), T.sqr(T.addc(z2, -t[1]))), 0.5), a = T.backward(L);
          return { g: [a[b1], a[b2], a[sv]], len: T.length, z: [T.val(z1), T.val(z2)] };
        };
        const curve = memo();
        let info = null;
        v.render(() => {
          const s = sS.value, K = KS.value, t = [Ht.x, Ht.y], I = implicitGrad(s, b0, t), U = unrolledGrad(s, b0, t, K);
          // vector field and contours of the loss
          sZ.field((x, y) => { const f = fz([x, y], s, b0); return [f[0] - x, f[1] - y]; }, { spacing: 26, color: 'muted', alpha: 0.5 });
          for (const r of [0.25, 0.5, 0.75, 1, 1.25]) sZ.circle(t[0], t[1], r, { color: 'red', width: 0.7, alpha: 0.25 });
          const path = [[0, 0]]; let z = [0, 0]; for (let k = 0; k < K; k++) { z = fz(z, s, b0); path.push(z); }
          sZ.path(path, { color: 'gold', width: 1.6 }); sZ.dots(path, { r: 2.8, color: 'gold' });
          sZ.dot(0, 0, { r: 4, color: 'ink', label: 'z₀', labelPos: 'sw' });
          const conv = I.dz < 1e-9;
          sZ.dot(I.z[0], I.z[1], { r: 7, color: conv ? 'green' : 'red', label: conv ? 'z*' : 'no fixed point reached', labelPos: 'ne' });
          sZ.text(`z_K, K = ${K}`, path[K][0], path[K][1], { dx: -8, dy: 12, align: 'right', size: 11.5, color: 'gold', weight: 600, plate: true });
          // error vs K
          const E = curve(s.toFixed(3) + '|' + t[0].toFixed(4) + '|' + t[1].toFixed(4), () => Array.from({ length: 60 }, (_, k) => { const u = unrolledGrad(s, b0, t, k + 1); return [k + 1, Math.max(1e-16, Math.hypot(u.g[0] - I.g[0], u.g[1] - I.g[1], u.g[2] - I.g[2]))]; }));
          sE.path(E, { color: 'accent', width: 2 }); sE.dots(E, { r: 2.8, color: 'accent' });
          if (I.rho < 1) { const e1 = E[4][1] / I.rho ** 5; sE.fn((k) => Math.max(1e-16, e1 * I.rho ** k), { color: 'ink', width: 1.2, dash: [5, 4] }); }
          sE.vline(K, { color: 'gold', width: 1.4, dash: [4, 3] }); sE.dot(K, E[K - 1][1], { r: 6, color: 'gold' });
          // finite-difference check of the true gradient of L(z*(θ))
          const h = 1e-6, Lb = (db1, db2, ds) => loss(fixed(s + ds, [b0[0] + db1, b0[1] + db2]).z, t);
          const fd = [(Lb(h, 0, 0) - Lb(-h, 0, 0)) / (2 * h), (Lb(0, h, 0) - Lb(0, -h, 0)) / (2 * h), (Lb(0, 0, h) - Lb(0, 0, -h)) / (2 * h)];
          info = { I, U, fd, conv, K, err: E[K - 1][1] };
        });
        v.legend([['gold', 'iterates $z_k$'], ['green', 'fixed point $z^\\ast$', { dot: true }], ['accent', 'gap to the implicit gradient'], ['ink', 'predicted $\\propto\\rho^K$', { dash: true }]]);
        v.readout(() => info && (info.conv ? String.raw`contraction rate $\rho=${info.I.rho.toFixed(3)}$ · implicit gradient $(\partial_{b_1},\partial_{b_2},\partial_s)L=(${info.I.g.map((x) => mnus(x.toFixed(6))).join(',\,')})$, finite differences on $z^\ast$: $(${info.fd.map((x) => mnus(x.toFixed(6))).join(',\,')})$ · unrolled with $K=${info.K}$: gap $${tsci(info.err, 1)}$, tape of **${info.U.len} entries** (grows with $K$) versus one $2\times2$ solve for the implicit gradient` :
          String.raw`**the iteration does not converge** (contraction rate $\rho=${info.I.rho.toFixed(3)}$ ${info.I.rho >= 1 ? '$\\ge1$' : ''}): there is no well-defined $z^\ast$ to differentiate, and the unrolled gradients do not settle — lower $s$`));
      },
    },
    // ───────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Paper',
      name: 'Learning representations by back-propagating errors',
      paper: { authors: 'David E. Rumelhart, Geoffrey E. Hinton and Ronald J. Williams', year: 1986, title: 'Learning representations by back-propagating errors', venue: 'Nature 323 (6088): 533–536', doi: '10.1038/323533a0' },
      introduces: [],
      credit: 'Rumelhart, Hinton & Williams, 1986',
      statement: String.raw`The paper showed that multilayer networks of logistic units can be trained by gradient descent on the squared error $E=\tfrac12\sum_{c}\sum_j(y_{j,c}-d_{j,c})^2$, with the gradient computed by propagating error derivatives backwards through the layers — the **back-propagation** procedure, used with the momentum update $\Delta w(t)=-\varepsilon\,\partial E/\partial w+\alpha\,\Delta w(t-1)$. Its point was representational: the **hidden units** come to encode features of the task that are not present in the input or output. Two experiments: (i) detecting **mirror symmetry** of 6-bit inputs with only two hidden units, where the learned weights are antisymmetric about the centre with magnitudes in the ratio $1:2:4$, so that each hidden unit is silent exactly on symmetric inputs; (ii) the **family trees** task — 104 relationship facts (*person* — *relationship* — *person*) about two isomorphic families — where a network with small bottleneck layers learns distributed codes for people that capture nationality, generation and branch of the family, and generalises to held-out facts. The authors noted that gradient descent can get stuck in poor local minima, though this was rare in their tasks.`,
      idea: String.raw`Before 1986, the perceptron learning rule could train only a single layer of adjustable weights, and Minsky and Papert's analysis (1.4) had made the lack of a learning rule for hidden units the field's central obstacle. The chain rule for layered networks had been written down before — in automatic differentiation by Linnainmaa (1970) and for networks by Werbos (1974) — but this paper, with the longer PDP chapter by the same authors, demonstrated on concrete tasks that it discovers useful internal representations, and it made back-propagation the standard way to train neural networks. Modern practice keeps the algorithm (3.3) and changes nearly everything around it: cross-entropy instead of squared error, ReLU instead of logistic units, Adam and mini-batches instead of full-batch momentum.`,
      caption: String.raw`**Symmetry**: the paper's 6–2–1 network of logistic units, trained live with its own rule ($\varepsilon=0.1$, $\alpha=0.9$, one update per sweep through all 64 patterns) from small random weights (change the seed). Left: the weights (blue positive, orange negative, numbers on the edges); right: the error per sweep, with the paper's 1,425 sweeps marked. Most seeds end in the paper's solution — mirror-image weights in the ratio $1:2:4$; a few find a different symmetric solution. **Family trees**: the 24-person network trained with Adam and a softmax output (modern choices, not the paper's) on 100 of the 104 facts; left, both families coloured by the activity of one of the six person-encoding units (choose it with the slider); right, the loss and the four held-out facts.`,
      deps: ['deep-3.3', 'deep-1.4'],
      refs: [],
      tags: ['backpropagation', 'history', 'representation learning'],
      links: { doi: 'https://doi.org/10.1038/323533a0' },
      viz(v) {
        const modeS = v.select('experiment', [{ value: 'sym', label: 'symmetry (6–2–1)' }, { value: 'fam', label: 'family trees' }], 'sym');
        const seedS = v.slider('seed', 1, 12, 3, { int: true });
        const unitS = v.slider('person unit', 1, 6, 1, { int: true });
        const sL = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1.15, minWidth: 320, title: 'network' });
        const sR = v.stage({ x: [0, 4000], y: [0.01, 10], ylog: true, height: 340, axes: 'box', gutter: true, xlabel: 'sweeps', weight: 0.85, minWidth: 260, title: 'error' });
        const tL = titler(sL), tR = titler(sR);
        const S = v.sim(() => (modeS.value === 'sym' ? { kind: 'sym', st: symInit(seedS.value) } : { kind: 'fam', st: famInit(seedS.value) }),
          (X) => { if (X.kind === 'sym') { for (let k = 0; k < 40 && X.st.sweep < 6000; k++) symSweep(X.st); } else { for (let k = 0; k < 4 && X.st.epoch < 1500; k++) famEpoch(X.st); if (X.st.epoch % 20 === 0) X.st.acc.push([X.st.epoch, X.st.test.filter((i) => famCorrect(X.st, i)).length, TRIPLES.map((_, i) => i).filter((i) => !X.st.test.includes(i) && famCorrect(X.st, i)).length]); } }, { dt: 1 / 60 });
        let key = '', info = null;
        v.animate((t) => {
          const k = modeS.value + '|' + seedS.value; if (k !== key) { key = k; S.reset(); v.restart(); }
          unitS.el.hidden = modeS.value !== 'fam';
          S.advance(t); const X = S.state;
          if (X.kind === 'sym') {
            const st = X.st; tL('the 6–2–1 symmetry network'); tR('error $E$ per sweep through the 64 patterns'); sR.setLabels('sweeps', undefined);
            sR.setView([0, Math.max(2000, Math.ceil((st.sweep + 1) / 1000) * 1000)], [0.005, 10]);
            // diagram: inputs bottom, two hidden units, output top
            const inX = (i) => 0.12 + (0.76 * i) / 5, H = [[0.3, 0.55], [0.7, 0.55]], O = [0.5, 0.88], wmax = Math.max(1, ...st.W1.flat().map(Math.abs));
            for (let j = 0; j < 2; j++) for (let i = 0; i < 6; i++) { const w = st.W1[j][i], tt = Math.min(1, Math.abs(w) / wmax); sL.line(inX(i), 0.14, H[j][0], H[j][1], { color: w >= 0 ? 'accent' : 'orange', width: 0.5 + 5 * tt, alpha: 0.3 + 0.65 * tt }); }
            for (let j = 0; j < 2; j++) { const w = st.W2[j], tt = Math.min(1, Math.abs(w) / wmax); sL.line(H[j][0], H[j][1], O[0], O[1], { color: w >= 0 ? 'accent' : 'orange', width: 0.5 + 5 * tt, alpha: 0.3 + 0.65 * tt }); }
            for (let i = 0; i < 6; i++) { sL.dot(inX(i), 0.14, { r: 11, color: 'panel' }); sL.dot(inX(i), 0.14, { r: 11, hollow: true, color: 'ink', width: 1.4 }); sL.text(String(i + 1), inX(i), 0.14, { align: 'center', size: 11, color: 'muted' }); }
            for (let j = 0; j < 2; j++) {
              for (let i = 0; i < 6; i++) { const w = st.W1[j][i], px = inX(i) + (H[j][0] - inX(i)) * 0.3, py = 0.14 + (H[j][1] - 0.14) * 0.3 + (j ? -0.025 : 0.025); sL.text(mnus(w.toFixed(1)), px, py, { align: 'center', size: 10.5, color: w >= 0 ? 'accent' : 'orange', weight: 600, plate: true }); }
              sL.dot(H[j][0], H[j][1], { r: 16, color: 'panel' }); sL.dot(H[j][0], H[j][1], { r: 16, hollow: true, color: 'ink', width: 1.6 }); sL.text(mnus(st.W1[j][6].toFixed(1)), H[j][0], H[j][1], { align: 'center', size: 10.5, color: 'muted' });
              sL.text(mnus(st.W2[j].toFixed(1)), (H[j][0] + O[0]) / 2, (H[j][1] + O[1]) / 2, { dx: j ? 14 : -14, align: 'center', size: 10.5, color: st.W2[j] >= 0 ? 'accent' : 'orange', weight: 600, plate: true });
            }
            sL.dot(O[0], O[1], { r: 16, color: 'panel' }); sL.dot(O[0], O[1], { r: 16, hollow: true, color: 'ink', width: 1.6 }); sL.text(mnus(st.W2[2].toFixed(1)), O[0], O[1], { align: 'center', size: 10.5, color: 'muted' });
            sL.text('output: symmetric?', O[0], O[1], { dy: -26, align: 'center', size: 11.5, color: 'muted' }); sL.text('inputs (bits 1–6)', 0.5, 0.14, { dy: 24, align: 'center', size: 11.5, color: 'muted' });
            // error curve
            const hs = st.hist, stride = Math.max(1, Math.floor(hs.length / 600)), pts = []; for (let i = 0; i < hs.length; i += stride) pts.push([i + 1, Math.max(0.005, hs[i])]);
            sR.path(pts, { color: 'accent', width: 2 });
            sR.vline(1425, { color: 'purple', width: 1.4, dash: [5, 4] }); sR.text('paper: 1,425', 1425, 6, { dx: 5, align: 'left', size: 11.5, color: 'purple', weight: 600 });
            if (st.done != null) { sR.vline(st.done, { color: 'green', width: 1.4 }); sR.text(`here: ${st.done.toLocaleString('en-US')}`, st.done, 2.5, { dx: 5, size: 11.5, color: 'green', weight: 600 }); }
            const mags = st.W1.map((w) => w.slice(0, 6).map(Math.abs)), anti = st.W1.map((w) => Math.max(...[0, 1, 2].map((i) => Math.abs(w[i] + w[5 - i]))) / Math.max(...w.slice(0, 6).map(Math.abs)));
            const ratio = mags.map((m) => { const q = [m[0], m[1], m[2]].sort((a, b) => a - b); return q.map((x) => x / q[0]); });
            info = { kind: 'sym', sweep: st.sweep, E: hs[hs.length - 1] || 0, worst: st.worst ?? 1, done: st.done, ratio, anti };
          } else {
            const st = X.st, u = unitS.value - 1; tL(`the two family trees, coloured by person unit ${u + 1}`); tR('training loss (cross-entropy)'); sR.setLabels('epochs', undefined);
            sR.setView([0, 1500], [0.003, 5]);
            const act = new Array(24); for (let p = 0; p < 24; p++) act[p] = sigm(st.P.Ep[p * 6 + u] + st.P.b1[u]);
            const fx = (fam, x) => 0.04 + (fam ? 0.5 : 0) + (x / 6) * 0.42, fy = (g) => 0.12 + ((g - 1) / 2) * 0.66;
            for (let fam = 0; fam < 2; fam++) {
              sL.text(fam ? 'Italian family' : 'English family', fx(fam, 3), 0.96, { align: 'center', size: 12, color: 'muted', weight: 600 });
              for (const [a, bq] of [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9]]) sL.line(fx(fam, TREE_POS[a][0]), fy(4 - TREE_POS[a][1]), fx(fam, TREE_POS[bq][0]), fy(4 - TREE_POS[bq][1]), { color: 'muted', width: 1.4 });
              for (const [c, [pa, ma]] of Object.entries(PAR)) { const mx = (fx(fam, TREE_POS[pa][0]) + fx(fam, TREE_POS[ma][0])) / 2, my = fy(4 - TREE_POS[pa][1]); sL.line(mx, my, fx(fam, TREE_POS[c][0]), fy(4 - TREE_POS[c][1]), { color: 'faint', width: 1 }); }
              for (let p = 0; p < 12; p++) {
                const x = fx(fam, TREE_POS[p][0]), y = fy(4 - TREE_POS[p][1]), a = act[p + 12 * fam];
                sL.dot(x, y, { r: 9, color: v.ramp(a, 'purple') }); sL.dot(x, y, { r: 9, hollow: true, color: SEX[p] === 'm' ? 'accent' : 'pink', width: 1.6 });
                sL.text(NAMES[fam][p], x, y, { dy: p % 2 ? 15 : -15, align: 'center', size: 9.5, color: 'ink' });
              }
            }
            const pts = st.hist.map((L, i) => [i + 1, Math.max(0.003, L)]);
            sR.path(pts, { color: 'accent', width: 2 });
            const last = st.acc[st.acc.length - 1] || [0, 0, 0];
            sR.text(`held-out facts correct: ${last[1]} / 4`, 1480, 3, { align: 'right', size: 12, color: last[1] >= 3 ? 'green' : 'red', weight: 600, plate: true });
            sR.text(`training facts: ${last[2]} / 100`, 1480, 1.6, { align: 'right', size: 12, color: 'muted', weight: 600, plate: true });
            // what does each unit encode? correlations with nationality, generation and family branch
            const corr = (f) => { const xs = act.map((_, p) => f(p)), mx = xs.reduce((s, q) => s + q, 0) / 24, my = act.reduce((s, q) => s + q, 0) / 24; let sxy = 0, sxx = 0, syy = 0; for (let p = 0; p < 24; p++) { sxy += (xs[p] - mx) * (act[p] - my); sxx += (xs[p] - mx) ** 2; syy += (act[p] - my) ** 2; } return sxy / Math.sqrt(sxx * syy + 1e-300); };
            const nat = corr((p) => (p < 12 ? 0 : 1)), gen = corr((p) => GEN[p % 12]), br = corr((p) => ([0, 1, 4, 5, 6, 10, 11].includes(p % 12) ? 0 : 1));
            info = { kind: 'fam', epoch: st.epoch, L: st.hist[st.hist.length - 1] || 0, te: last[1], tr: last[2], test: st.test, nat, gen, br, u, allNat: [0, 1, 2, 3, 4, 5].map((q) => { const a2 = act.map((_, p) => sigm(st.P.Ep[p * 6 + q] + st.P.b1[q])); const m1 = a2.slice(0, 12).reduce((s, x) => s + x, 0) / 12, m2 = a2.slice(12).reduce((s, x) => s + x, 0) / 12; return Math.abs(m1 - m2); }) };
          }
        }, { period: 9, once: true, still: 8.9 });
        v.legend([['accent', 'positive weight / loss'], ['orange', 'negative weight'], ['purple', 'paper / unit activity']]);
        v.readout(() => {
          if (!info) return '';
          if (info.kind === 'sym') {
            const r = info.ratio.map((q) => q.map((x) => x.toFixed(2)).join(' : '));
            return `sweep ${info.sweep.toLocaleString('en-US')} · $E=${tsci(info.E, 3)}$ · worst output error ${info.worst.toFixed(3)}` + (info.done != null ? ` · all 64 patterns within 0.3 of target after **${info.done.toLocaleString('en-US')} sweeps** (paper: 1,425)` : '') +
              ` · hidden-unit weight magnitudes, sorted and scaled: ${r.join(' and ')} (paper: $1:2:4$) · antisymmetry $\\max|w_i+w_{7-i}|/\\max|w|$: ${info.anti.map((x) => x.toFixed(3)).join(', ')}`;
          }
          const tl = info.test.map((i) => `${NAMES[TRIPLES[i][0] >= 12 ? 1 : 0][TRIPLES[i][0] % 12]}'s ${RELS[TRIPLES[i][1]]}`).join(', ');
          return `epoch ${info.epoch} · loss ${info.L.toFixed(4)} · training facts ${info.tr}/100, held-out facts (${tl}) **${info.te}/4** · person unit ${info.u + 1} correlates with nationality ${mnus(info.nat.toFixed(2))}, generation ${mnus(info.gen.toFixed(2))}, family branch ${mnus(info.br.toFixed(2))} · the unit that best separates the two families: unit ${1 + info.allNat.indexOf(Math.max(...info.allNat))}`;
        });
      },
    },
  ],
};
