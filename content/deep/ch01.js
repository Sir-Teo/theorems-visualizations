// Deep Learning Theory — Chapter 1: Neural networks as functions (items 1.1–1.5; 1.6–1.10 in ch01-b.js)
//
// The engine (dense layers, backpropagation, Adam), toy data, exact piecewise-linear algebra and the drawing helpers
// live in ch01.shared.js. Every number on screen is computed: networks are evaluated, trained and counted live.
import {
  clamp, sigm, ACTS, makeNet, forward, makeTrainer, rand, hashStr, memo, lstsq, rampLUT, note, titler,
  plEval, plCompose, plSimplify, plPieces, drawNet, mnus,
} from './ch01.shared.js';

const CYC = ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'blue'];
/** A rectangular sub-plot inside a stage: data (u, w) in [u0,u1]×[w0,w1] → stage coordinates in box [x0,x1]×[y0,y1]. */
function sub(box, ur, wr) {
  const [x0, x1, y0, y1] = box;
  return (u, w) => [x0 + ((u - ur[0]) / (ur[1] - ur[0])) * (x1 - x0), y0 + ((clamp(w, wr[0] - 0.05 * (wr[1] - wr[0]), wr[1] + 0.05 * (wr[1] - wr[0])) - wr[0]) / (wr[1] - wr[0])) * (y1 - y0)];
}

export default {
  collection: 'deep',
  chapter: 1,
  title: 'Neural networks as functions',
  summary: String.raw`A neural network is a composition of affine maps and fixed nonlinearities. With ReLU activations it is a continuous piecewise-linear function whose linear pieces can be drawn and counted, and depth multiplies them by folding the input space. One hidden layer already solves problems no linear model can, such as XOR. Training means choosing the parameters to minimize an empirical risk, and the standard losses are negative log-likelihoods of simple output distributions — squared error for Gaussian noise, absolute error for Laplace noise, cross-entropy for categories — which makes logistic regression the one-layer special case.`,
  items: [
    // ───────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Model',
      name: 'Artificial neuron',
      credit: 'McCulloch & Pitts, 1943; Rosenblatt, 1958',
      statement: String.raw`An **artificial neuron** with inputs $x\in\R^d$, **weights** $w\in\R^d$, **bias** $b\in\R$ and **activation function** $\sigma:\R\to\R$ computes
$$a=\sigma(z),\qquad z=w\cdot x+b=\sum_{i=1}^d w_ix_i+b .$$
The **pre-activation** $z$ is an affine function of the input, so the neuron is constant on every hyperplane $w\cdot x=\text{const}$: its level sets are parallel hyperplanes orthogonal to $w$, and its output varies only along the direction of $w$ (a *ridge function*). With the Heaviside step $\sigma=\mathbf 1_{z\ge0}$ it is the McCulloch–Pitts threshold unit, which splits $\R^d$ into two half-spaces along the **decision boundary** $w\cdot x+b=0$; a point at signed distance $\delta$ from that boundary has $z=\norm{w}\,\delta$.`,
      idea: String.raw`Everything interesting about one neuron is in the affine map $z=w\cdot x+b$: the direction of $w$ sets which way the boundary faces, its length $\norm w$ sets how fast $z$ grows as you walk away from it (so a long $w$ makes a smooth activation look like a step), and $-b/\norm w$ is the boundary's signed distance from the origin. The activation only reshapes the profile of $a$ across the boundary, never the boundary's shape, which is why a single neuron can only separate classes by a hyperplane (1.4). Networks get their power by feeding many such ridge functions into further neurons (1.3, 1.5).`,
      caption: String.raw`Left: the input plane coloured by the neuron's output $a=\sigma(w\cdot x+b)$. Drag the orange handle (a point of the boundary $z=0$) to slide the line, and the blue arrow tip to turn it and change $\norm w$; the dashed lines are $z=\pm1$, which squeeze together as $\norm w$ grows. Drag the gold probe and read its $z$ and $a$ on the right, where the neuron is drawn with its weights and the activation curve. The readout counts how many of the twelve labelled points land on the correct side.`,
      deps: [],
      refs: ['Prince §3.1', 'Goodfellow §6.3'],
      tags: ['neuron', 'activation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Artificial_neuron' },
      viz(v) {
        const actS = v.select('activation', [{ value: 'step', label: 'step' }, { value: 'sigmoid', label: 'sigmoid' }, { value: 'tanh', label: 'tanh' }, { value: 'relu', label: 'ReLU' }], 'sigmoid');
        const sL = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 360, axes: 'box', gutter: true, xlabel: '$x_1$', ylabel: '$x_2$', title: 'output $a$ over the input plane' });
        const sR = v.stage({ x: [0, 10], y: [0, 10], height: 360, axes: false, title: 'the neuron, and $a=\\sigma(z)$ at the probe' });
        const P = sL.handle(-0.4, 0.3, { color: 'orange', label: 'boundary', labelPos: 'sw' });
        const Wt = sL.handle(0.6, 1.1, { color: 'accent', label: '$w$', labelPos: 'ne' });
        const X = sL.handle(1.5, -1.6, { color: 'gold', label: '$x$', labelPos: 'se' });
        let wv = [Wt.x - P.x, Wt.y - P.y];
        P.onDrag = () => { Wt.set(P.x + wv[0], P.y + wv[1]); };
        Wt.onDrag = () => { wv = [Wt.x - P.x, Wt.y - P.y]; };
        const r = rand(11), pts = [];
        for (let i = 0; i < 12; i++) { const c = i % 2, m = c ? [0.9, 0.9] : [-1.1, -0.8]; pts.push([m[0] + r.normal() * 0.65, m[1] + r.normal() * 0.65, c]); }
        const F = { step: (z) => (z >= 0 ? 1 : 0), sigmoid: sigm, tanh: Math.tanh, relu: (z) => Math.max(0, z) };
        const range = { step: [0, 1], sigmoid: [0, 1], tanh: [-1, 1], relu: [0, 4] };
        let info = null;
        v.render(() => {
          const act = actS.value, f = F[act], [lo, hi] = range[act], w = [Wt.x - P.x, Wt.y - P.y], b = -(w[0] * P.x + w[1] * P.y), nw = Math.hypot(w[0], w[1]) || 1e-9;
          const lut = rampLUT(v, 'accent', 64, 'panel', 0.75), lutN = rampLUT(v, 'orange', 64, 'panel', 0.75);
          sL.raster((x, y) => { const a = f(w[0] * x + w[1] * y + b), t = (a - lo) / (hi - lo); if (act === 'tanh') { const u = Math.round(Math.min(1, Math.abs(a)) * 63); return a >= 0 ? lut[u] : lutN[u]; } return lut[Math.round(clamp(t, 0, 1) * 63)]; }, { res: 3, key: [act, w, b].join('|') });
          // boundary and z = ±1
          const line = (c, st) => { const n = [w[0] / nw, w[1] / nw], d = (c - b) / nw, p0 = [n[0] * d, n[1] * d], t = [-n[1], n[0]]; sL.line(p0[0] - 9 * t[0], p0[1] - 9 * t[1], p0[0] + 9 * t[0], p0[1] + 9 * t[1], st); };
          line(0, { color: 'ink', width: 2.4 }); line(1, { color: 'ink', width: 1.1, dash: [5, 4], alpha: 0.6 }); line(-1, { color: 'ink', width: 1.1, dash: [5, 4], alpha: 0.6 });
          sL.arrow(P.x, P.y, Wt.x, Wt.y, { color: 'accent', width: 2.6 });
          let ok = 0;
          for (const [x, y, c] of pts) { const z = w[0] * x + w[1] * y + b, good = (z >= 0) === (c === 1); ok += good; sL.dot(x, y, { r: 5, color: c ? 'green' : 'purple' }); if (!good) sL.dot(x, y, { r: 8.5, hollow: true, color: 'red', width: 2 }); }
          const z = w[0] * X.x + w[1] * X.y + b, a = f(z);
          // right: diagram
          const nodes = [[1.2, 8.6, 'x_1'], [1.2, 6.9, 'x_2'], [1.2, 5.2, '1']], S = [4.6, 6.9], A = [8.2, 6.9];
          const wl = [w[0], w[1], b];
          nodes.forEach(([x, y, t], i) => {
            const u = wl[i], col = u >= 0 ? 'accent' : 'orange';
            sR.line(x, y, S[0], S[1], { color: col, width: 1 + Math.min(4, Math.abs(u) * 1.6), alpha: 0.75 });
            sR.dot(x, y, { r: 13, hollow: true, color: 'ink', width: 1.4 }); sR.tex(t, x, y, { size: 14 });
            sR.tex(`${i < 2 ? 'w_' + (i + 1) : 'b'}=${mnus(u.toFixed(2))}`, (x + S[0]) / 2 - 0.2, (y + S[1]) / 2 + 0.38, { size: 13, color: col });
          });
          sR.arrow(S[0] + 0.55, S[1], A[0] - 0.6, A[1], { color: 'ink', width: 1.6, head: 7 });
          sR.dot(S[0], S[1], { r: 16, hollow: true, color: 'ink', width: 1.6 }); sR.tex('\\Sigma', S[0], S[1], { size: 17 });
          sR.dot(A[0], A[1], { r: 16, hollow: true, color: 'ink', width: 1.6 }); sR.tex('\\sigma', A[0], A[1], { size: 17 });
          sR.tex(`z=${mnus(z.toFixed(2))}`, (S[0] + A[0]) / 2, S[1] + 0.5, { size: 13, color: 'gold' });
          sR.tex(`a=${mnus(a.toFixed(3))}`, A[0], A[1] - 1.1, { size: 13, color: 'gold' });
          // right: activation curve inset
          const box = [1.0, 9.6, 0.7, 4.0], zr = [-6, 6], m = sub(box, zr, [lo, hi]);
          sR.rect(box[0], box[2] - 0.1, box[1], box[3] + 0.1, { color: 'grid', width: 1 });
          sR.line(...m(0, lo), ...m(0, hi), { color: 'faint', width: 1 });
          if (lo < 0) sR.line(...m(zr[0], 0), ...m(zr[1], 0), { color: 'faint', width: 1 });
          const cp = []; for (let i = 0; i <= 240; i++) { const zz = zr[0] + (12 * i) / 240; cp.push(act === 'step' && i > 0 && Math.sign(zz) !== Math.sign(zr[0] + (12 * (i - 1)) / 240) ? null : m(zz, f(zz))); }
          sR.path(cp, { color: 'accent', width: 2.4 });
          const zc = clamp(z, zr[0], zr[1]); sR.line(...m(zc, lo), ...m(zc, f(zc)), { color: 'gold', width: 1.4, dash: [3, 3] });
          sR.dot(...m(zc, f(zc)), { r: 5, color: 'gold' });
          sR.text('z', box[1], box[2] - 0.1, { dy: 10, align: 'right', math: true, color: 'muted' });
          sR.text(mnus('−6'), box[0], box[2] - 0.1, { dy: 10, align: 'left', size: 10.5, color: 'muted' }); sR.text('6', box[1] - 0.35, box[2] - 0.1, { dy: 10, align: 'right', size: 10.5, color: 'muted' });
          info = { w, b, nw, z, a, ok, dist: z / nw };
        });
        v.legend([['ink', 'boundary $z=0$'], ['ink', '$z=\\pm1$', { dash: true }], ['purple', 'class 0', { dot: true }], ['green', 'class 1 (want $z\\ge0$)', { dot: true }], ['red', 'wrong side', { dot: true }]]);
        v.readout(() => info && String.raw`$w=(${mnus(info.w[0].toFixed(2))},\,${mnus(info.w[1].toFixed(2))})$, $b=${mnus(info.b.toFixed(2))}$ · gap between $z=0$ and $z=1$: $1/\lVert w\rVert=${(1 / info.nw).toFixed(3)}$ · probe: $z=${mnus(info.z.toFixed(3))}$ $=\lVert w\rVert\times$ (signed distance ${mnus(info.dist.toFixed(3))}), $a=${mnus(info.a.toFixed(3))}$ · **${info.ok} of 12** points on the correct side`);
      },
    },
    // ───────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Activation functions: sigmoid, tanh, ReLU',
      statement: String.raw`The standard activation functions, applied coordinatewise to pre-activations $z$:
- **logistic sigmoid** $\sigma(z)=1/(1+e^{-z})\in(0,1)$, with $\sigma'(z)=\sigma(z)\bigl(1-\sigma(z)\bigr)\le\tfrac14$;
- **hyperbolic tangent** $\tanh z=2\sigma(2z)-1\in(-1,1)$, with $\tanh'(z)=1-\tanh^2z\le1$;
- **rectified linear unit** $\mathrm{ReLU}(z)=\max(0,z)$, with derivative $1$ for $z>0$ and $0$ for $z<0$ (any value in $[0,1]$ may be used at $0$).

Sigmoid and tanh are smooth, bounded and **saturate**: their derivatives decay like $e^{-|z|}$ as $|z|\to\infty$. ReLU is unbounded, piecewise linear and does not saturate for $z>0$. Common variants: leaky ReLU $\max(\alpha z,z)$ with small $\alpha>0$, softplus $\log(1+e^z)$ (a smooth ReLU, whose derivative is $\sigma$) and GELU $z\,\Phi(z)$ with $\Phi$ the standard normal distribution function.`,
      idea: String.raw`Backpropagation multiplies one activation derivative per layer along every path from the loss to a weight (3.3). A sigmoid contributes a factor of at most $\tfrac14$, so a chain of $L$ sigmoid units shrinks the signal by at least $4^{-L}$; tanh contributes at most $1$, reached only at $z=0$; ReLU contributes exactly $1$ or exactly $0$. That is why deep networks moved to ReLU-like units, and why their gradients flow through the *active* units unchanged but die at inactive ones (5.1). The nonlinearity itself is essential: without it the whole network collapses to one affine map, and with a polynomial activation it is not universal (2.3).`,
      caption: String.raw`Left: the activations; right: their derivatives. Drag the gold handle to set the mean pre-activation $\mu$. Below, on a log scale, the product $\prod_{\ell=1}^{L}\phi'(z_\ell)$ along a chain of $L$ units whose pre-activations are $z_\ell=\mu+s\,\xi_\ell$ with fixed seeded noise $\xi_\ell$: the factor the gradient picks up through $L$ layers. Push $\mu$ away from $0$ and watch sigmoid and tanh vanish exponentially; ReLU's product stays exactly $1$ until the first negative pre-activation kills it (marked ✕).`,
      deps: ['deep-1.1'],
      refs: ['Goodfellow §6.3', 'Prince §3.1'],
      tags: ['activation', 'vanishing gradient'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Activation_function' },
      viz(v) {
        const sS = v.slider('spread $s$ of the pre-activations', 0, 2, 0.6, { step: 0.05 });
        const more = v.toggle('also leaky ReLU, softplus, GELU', false);
        const sA = v.stage({ x: [-6, 6], y: [-1.6, 3], height: 250, axes: 'box', gutter: true, xlabel: '$z$', title: 'activation $\\phi(z)$' });
        const sD = v.stage({ x: [-6, 6], y: [-0.1, 1.15], height: 250, axes: 'box', gutter: true, xlabel: '$z$', title: "derivative $\\phi'(z)$" });
        const sC = v.stage({ x: [1, 30], y: [1e-16, 3], ylog: true, height: 250, full: true, axes: 'box', gutter: true, xlabel: 'depth $L$', title: "gradient factor through a chain: $\\prod_{\\ell\\le L}\\phi'(z_\\ell)$" });
        const H = sA.handle(0.8, -1.38, { color: 'gold', label: '$\\mu$', labelPos: 'ne', constrain: (x) => [clamp(x, -5.5, 5.5), -1.38] });
        const xi = (() => { const r = rand(5), o = []; for (let i = 0; i < 30; i++) o.push(r.normal()); return o; })();
        const base = [['sigmoid', 'accent'], ['tanh', 'green'], ['relu', 'orange']], extra = [['leaky', 'purple'], ['softplus', 'teal'], ['gelu', 'pink']];
        const NAME = { sigmoid: 'sigmoid', tanh: 'tanh', relu: 'ReLU', leaky: 'leaky ReLU', softplus: 'softplus', gelu: 'GELU' };
        let info = null;
        v.render(() => {
          const list = more.value ? base.concat(extra) : base, mu = H.x, s = sS.value;
          for (const st of [sA, sD]) { st.vband(mu - s, mu + s, { color: 'gold', alpha: 0.1 }); st.vline(mu, { color: 'gold', width: 1.4, dash: [4, 3] }); }
          sD.hline(0.25, { color: 'accent', width: 1, dash: [2, 4], alpha: 0.7 });
          const res = {};
          for (const [k, c] of list) {
            const A = ACTS[k];
            sA.fn(A.f, { color: c, width: k === 'relu' || k === 'sigmoid' || k === 'tanh' ? 2.6 : 1.8 });
            sD.fn((z) => A.d(z, A.f(z)), { color: c, width: 2.2 });
            sA.dot(mu, A.f(mu), { r: 4, color: c }); sD.dot(mu, A.d(mu, A.f(mu)), { r: 4, color: c });
            // chain product
            let p = 1, dead = 0; const pts = [];
            for (let l = 1; l <= 30; l++) { const z = mu + s * xi[l - 1]; p *= A.d(z, A.f(z)); if (p === 0 && !dead) dead = l; pts.push([l, p > 0 ? Math.max(p, 1e-300) : null]); }
            sC.path(pts, { color: c, width: 2.4 }); sC.dots(pts.filter((q) => q[1]), { r: 2.6, color: c });
            if (dead) { const prev = dead > 1 ? pts[dead - 2][1] : 1; sC.text('✕', dead, Math.max(2e-16, Math.min(2, prev)), { color: c, align: 'center', size: 15, weight: 700 }); }
            res[k] = { p10: pts[9][1] || 0, dead };
          }
          v.legend(list.map(([k, c]) => [c, NAME[k]]).concat([['gold', 'pre-activations $\\mu\\pm s$', { area: true }]]));
          info = { mu, res };
        });
        v.readout(() => {
          if (!info) return '';
          const { mu, res } = info, f = (k) => (res[k].dead ? `0 (dead at layer ${res[k].dead})` : `$${v.sci(res[k].p10, 2)}$`);
          return String.raw`at $z=\mu=${mnus(mu.toFixed(2))}$: $\sigma'=${ACTS.sigmoid.d(mu, sigm(mu)).toFixed(4)}$ (never above $0.25$), $\tanh'=${(1 - Math.tanh(mu) ** 2).toFixed(4)}$, $\mathrm{ReLU}'=${mu > 0 ? 1 : 0}$ · product over 10 layers: sigmoid ${f('sigmoid')}, tanh ${f('tanh')}, ReLU ${f('relu')}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Model',
      name: 'Shallow network (one hidden layer)',
      statement: String.raw`A **shallow network** (one hidden layer of width $m$) with input $x\in\R^d$ computes
$$f(x)=v_0+\sum_{k=1}^m v_k\,\sigma(w_k\cdot x+b_k),$$
with hidden-unit weights $w_k\in\R^d$, biases $b_k$, output weights $v_k$ and output bias $v_0$ — $m(d+2)+1$ parameters. In matrix form $f(x)=v^\top\sigma(Wx+b)+v_0$. For $d=1$ and $\sigma=\mathrm{ReLU}$, unit $k$ contributes a **hinge** $v_k\max(0,w_kx+b_k)$: zero on one side of the **kink** $x=-b_k/w_k$ and linear with slope $v_kw_k$ on the other. The sum is a continuous piecewise-linear function with at most $m+1$ pieces; on each piece the set of active units (the **activation pattern**) is fixed and the slope is the sum of the active units' slopes.`,
      idea: String.raw`Each hidden unit is a ridge function (1.1), and the output layer takes a linear combination of them. With ReLU the picture is completely explicit in one dimension: every kink is a place where one unit switches on or off, and crossing it changes the slope by exactly that unit's $v_kw_k$. Conversely, any continuous piecewise-linear function with $m$ kinks is such a sum, which is the engine of universal approximation in 1D (2.1). Once the hidden units are fixed, $f$ is *linear* in $(v_0,\dots,v_m)$, so fitting the output layer alone is ordinary least squares.`,
      caption: String.raw`Left: each hidden unit's contribution $v_k\,\mathrm{ReLU}(w_kx+b_k)$ in its own colour. Drag a unit's two handles: the dot on the axis moves its kink, the dot on the hinge sets its slope and which side is active. Right: their sum, coloured segment by segment, with each segment's activation pattern written beneath it (1 = unit on). Pick a target and press *least-squares output weights* to fit $v_0,\dots,v_m$ with the kinks held fixed.`,
      deps: ['deep-1.2'],
      refs: ['Prince §3.1', 'Prince §3.4'],
      tags: ['shallow network', 'ReLU'],
      viz(v) {
        const MAXU = 5;
        const nS = v.slider('hidden units $m$', 1, MAXU, 3, { int: true });
        const v0S = v.slider('output bias $v_0$', -1.5, 1.5, 0, { step: 0.01 });
        const tgS = v.select('target', [{ value: 'none', label: 'none' }, { value: 'sin', label: '$\\sin(2x)$' }, { value: 'bump', label: 'bump' }, { value: 'abs', label: '$|x|-0.5$' }], 'sin');
        const TG = { sin: (x) => Math.sin(2 * x), bump: (x) => 1.2 * Math.exp(-3 * x * x) - 0.3, abs: (x) => Math.abs(x) - 0.5 };
        const sL = v.stage({ x: [-2, 2], y: [-2, 2], height: 330, axes: 'box', gutter: true, xlabel: '$x$', title: 'hidden units: $v_k\\,\\mathrm{ReLU}(w_kx+b_k)$' });
        const sR = v.stage({ x: [-2, 2], y: [-2, 2], height: 330, axes: 'box', gutter: true, xlabel: '$x$', title: 'output $f(x)=v_0+\\sum_k v_k\\,\\mathrm{ReLU}(w_kx+b_k)$' });
        const U = [[-1.2, 1, -0.9], [-0.1, 1, 1.6], [0.9, 1, -1.8], [0.5, -1, 0.6], [-0.6, -1, 0.5]].map(([t, s, m]) => ({ t, s, m }));
        const KH = U.map((u, k) => sL.handle(u.t, 0, { color: CYC[k], r: 6, constrain: (x) => [clamp(x, -1.9, 1.9), 0] }));
        const SH = U.map((u, k) => sL.handle(u.t + 0.7 * u.s, 0.7 * u.m, { color: CYC[k], r: 6 }));
        KH.forEach((h, k) => (h.onDrag = () => { U[k].t = h.x; }));
        SH.forEach((h, k) => (h.onDrag = () => { const dx = h.x - U[k].t; if (Math.abs(dx) > 0.05) { U[k].s = Math.sign(dx); U[k].m = h.y / Math.abs(dx); } }));
        const unit = (u, x) => u.m * Math.max(0, u.s * (x - u.t));
        v.button('least-squares output weights', () => {
          const f = TG[tgS.value]; if (!f) return; const m = nS.value, A = [], y = [];
          for (let i = 0; i <= 200; i++) { const x = -2 + (4 * i) / 200; A.push([1, ...U.slice(0, m).map((u) => Math.max(0, u.s * (x - u.t)))]); y.push(f(x)); }
          const c = lstsq(A, y, 1e-9); v0S.set(clamp(c[0], -1.5, 1.5)); U.slice(0, m).forEach((u, k) => (u.m = c[k + 1]));
        });
        let info = null;
        v.render(() => {
          const m = nS.value, us = U.slice(0, m), tg = TG[tgS.value];
          U.forEach((u, k) => { const on = k < m; KH[k].visible = SH[k].visible = on; if (!SH[k].dragging) { SH[k].x = clamp(u.t + 0.7 * u.s, -2, 2); SH[k].y = clamp(0.7 * u.m, -2, 2); } if (!KH[k].dragging) KH[k].x = u.t; });
          sL.hline(0, { color: 'faint', width: 1 });
          us.forEach((u, k) => { sL.fn((x) => unit(u, x), { color: CYC[k], width: 2.6 }); sL.vline(u.t, { color: CYC[k], width: 1, dash: [3, 4], alpha: 0.6 }); });
          // the sum, segment by segment
          const f = (x) => v0S.value + us.reduce((s, u) => s + unit(u, x), 0);
          if (tg) sR.fn(tg, { color: 'muted', width: 2, dash: [6, 4] });
          const kinks = [...new Set(us.map((u) => +u.t.toFixed(6)))].sort((a, b) => a - b), edges = [-2, ...kinks.filter((t) => t > -2 && t < 2), 2];
          const pats = [];
          for (let i = 0; i < edges.length - 1; i++) {
            const a = edges[i], b = edges[i + 1], mid = (a + b) / 2, pat = us.map((u) => (u.s * (mid - u.t) > 0 ? 1 : 0)).join('');
            const slope = us.reduce((s, u) => s + (u.s * (mid - u.t) > 0 ? u.m * u.s : 0), 0);
            const col = CYC[i % CYC.length];
            sR.line(a, f(a), b, f(b), { color: col, width: 3.4 });
            if (b - a > 0.28) sR.text(pat, mid, -1.82, { align: 'center', size: 11.5, color: col, weight: 600 });
            pats.push({ pat, slope });
          }
          kinks.forEach((t) => { if (t > -2 && t < 2) { sR.vline(t, { color: 'faint', width: 1, dash: [3, 4] }); sR.dot(t, f(t), { r: 3.5, color: 'ink' }); } });
          let err = null; if (tg) { err = 0; for (let i = 0; i <= 400; i++) { const x = -2 + i / 100; err = Math.max(err, Math.abs(f(x) - tg(x))); } }
          info = { m, pieces: pats.length, pats, err, params: 3 * m + 1 };
        });
        v.legend([['accent', 'unit 1'], ['orange', 'unit 2'], ['green', 'unit 3'], ['muted', 'target', { dash: true }]]);
        v.readout(() => info && `${info.m} hidden units (${info.params} parameters) → **${info.pieces} linear pieces** (at most $m+1=${info.m + 1}$) · slopes ${info.pats.map((p) => `$${mnus(p.slope.toFixed(2))}$`).join(', ')}` + (info.err != null ? ` · max error to target ${info.err.toFixed(3)}` : ''));
      },
    },
    // ───────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Phenomenon',
      name: 'XOR needs a hidden layer',
      credit: 'Minsky & Papert, 1969',
      statement: String.raw`The four points of the exclusive-or problem, $(0,0),(1,1)$ labelled $0$ and $(0,1),(1,0)$ labelled $1$, are **not linearly separable**: no single neuron $\mathbf 1\{w\cdot x+b\ge0\}$ (and no logistic regression) classifies all four correctly; every line misclassifies at least one. A network with **one hidden layer of two ReLU units** computes XOR exactly, for example
$$h_1=\mathrm{ReLU}(x_1+x_2),\quad h_2=\mathrm{ReLU}(x_1+x_2-1),\quad f=h_1-2h_2,$$
which gives $f=0,1,1,0$ on the four points. The hidden layer maps the inputs to $(0,0),(1,0),(1,0),(2,1)$, where the classes *are* separated by a line.`,
      idea: String.raw`Suppose $w\cdot x+b$ were $\ge0$ on $(0,1)$ and $(1,0)$ and $<0$ on $(0,0)$ and $(1,1)$. Adding the first two inequalities gives $w_1+w_2+2b\ge0$, adding the last two gives $w_1+w_2+2b<0$: a contradiction, because both pairs have the same midpoint $(\tfrac12,\tfrac12)$. A hidden layer escapes by changing the representation: the map $x\mapsto h(x)$ folds the plane so that the two class-1 points land on top of each other and away from the class-0 points, after which a linear output unit suffices. Trained networks find such representations by gradient descent, though from some initializations they stall in poor local minima.`,
      caption: String.raw`**One layer**: drag the two handles to place a line; the counter never drops below one mistake, and the right panel proves it — for every direction $\theta$ of the line's normal it shows the fewest mistakes any offset can achieve. **Hand-built**: the network above; right, the hidden representation $(h_1,h_2)$: the whole input plane lands on a line bent at $x_1+x_2=1$, and the two label-1 points land on the same spot. **Trained**: a 2–2–1 tanh network learns by Adam from the seed you choose (press play to restart); the right panel shows the four points moving in hidden space until a line separates them. About half the seeds (1–4, 6, 11) get stuck with two points at $0.5$.`,
      deps: ['deep-1.3'],
      refs: ['Goodfellow §6.1'],
      tags: ['XOR', 'linear separability'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Perceptrons_(book)' },
      viz(v) {
        const modeS = v.select('model', [{ value: 'lin', label: 'one layer (a line)' }, { value: 'hand', label: 'two ReLU units, by hand' }, { value: 'train', label: 'two tanh units, trained' }], 'lin');
        const seedS = v.slider('seed', 1, 12, 5, { int: true });
        const sL = v.stage({ x: [-0.6, 1.6], y: [-0.6, 1.6], equal: true, height: 340, axes: 'box', gutter: true, xlabel: '$x_1$', ylabel: '$x_2$', title: 'input space' });
        const sR = v.stage({ x: [0, 180], y: [-0.2, 3.2], height: 340, axes: 'box', gutter: true, xlabel: ' ', ylabel: ' ', title: 'right panel' });
        const tR = titler(sR);
        const PTS = [[0, 0, 0], [1, 1, 0], [0, 1, 1], [1, 0, 1]];
        const A = sL.handle(-0.4, 0.75, { color: 'ink', r: 6 }), B = sL.handle(1.4, 0.1, { color: 'ink', r: 6 });
        const data = { X: PTS.map((p) => [p[0], p[1]]), Y: PTS.map((p) => p[2]) };
        const mk = (seed) => { const net = makeNet([2, 2, 1], { act: 'tanh', seed: hashStr('xor' + seed) }); return { net, T: makeTrainer(net, data, { head: 'bce', lr: 0.08 }) }; };
        const S = v.sim(() => mk(seedS.value), (st) => { st.T.step(2); }, { dt: 1 / 60 });
        let lastSeed = seedS.value;
        const hand = (x) => { const h1 = Math.max(0, x[0] + x[1]), h2 = Math.max(0, x[0] + x[1] - 1); return [h1, h2, h1 - 2 * h2]; };
        const mist = (n, b) => PTS.reduce((s, [x, y, c]) => s + (((n[0] * x + n[1] * y + b >= 0) ? 1 : 0) !== c ? 1 : 0), 0);
        const bestAt = (th) => { const n = [Math.cos(th), Math.sin(th)], pr = PTS.map(([x, y]) => n[0] * x + n[1] * y).sort((a, b) => a - b), cuts = [pr[0] - 1, ...pr.slice(0, 3).map((p, i) => (p + pr[i + 1]) / 2), pr[3] + 1]; let best = 4; for (const c of cuts) { best = Math.min(best, mist(n, -c), mist([-n[0], -n[1]], c)); } return best; };
        const bestCurve = []; for (let i = 0; i < 360; i++) { const th = (Math.PI * (i + 0.5)) / 360; bestCurve.push([(180 * (i + 0.5)) / 360, bestAt(th)]); }
        let info = null;
        v.animate((t) => {
          const mode = modeS.value; seedS.el.hidden = mode !== 'train';
          if (seedS.value !== lastSeed) { lastSeed = seedS.value; S.reset(); v.restart(); }
          const lutA = rampLUT(v, 'purple', 32, 'panel', 0.55), lutB = rampLUT(v, 'green', 32, 'panel', 0.55);
          A.visible = B.visible = mode === 'lin';
          let wrongs = 0, extra = '';
          if (mode === 'lin') {
            const d = [B.x - A.x, B.y - A.y], n = [-d[1], d[0]], b = -(n[0] * A.x + n[1] * A.y);
            sL.raster((x, y) => (n[0] * x + n[1] * y + b >= 0 ? lutB[12] : lutA[12]), { res: 3, key: [n, b].join('|') });
            sL.line(A.x - 5 * d[0], A.y - 5 * d[1], A.x + 5 * d[0], A.y + 5 * d[1], { color: 'ink', width: 2.4 });
            wrongs = Math.min(mist(n, b), 4);
            const th = ((Math.atan2(n[1], n[0]) % Math.PI) + Math.PI) % Math.PI;
            sR.setView([0, 180], [-0.3, 4.3]); sR.setLabels('normal direction θ (degrees)', undefined); tR('fewest mistakes of any line with normal direction θ');
            sR.hband(-0.3, 0.5, { color: 'green', alpha: 0.1 });
            sR.path(bestCurve, { color: 'red', width: 2.6 });
            sR.text('0 mistakes would be here — never reached', 90, 0.12, { align: 'center', color: 'green', size: 12 });
            sR.vline((th * 180) / Math.PI, { color: 'ink', width: 1.4, dash: [4, 3] });
            sR.dot((th * 180) / Math.PI, wrongs, { r: 5, color: 'gold' });
            extra = `your line: **${wrongs} mistake${wrongs === 1 ? '' : 's'}** · minimum over all lines: **${Math.min(...bestCurve.map((p) => p[1]))}**`;
          } else {
            let F, Hm, outLine, lo, hi;
            if (mode === 'hand') { F = (x) => hand(x)[2]; Hm = (x) => hand(x).slice(0, 2); outLine = [1, -2, -0.5]; lo = [-0.3, -0.3]; hi = [2.3, 1.3]; }
            else {
              S.advance(t); const net = S.state.net;
              F = (x) => sigm(forward(net, x)[0]); Hm = (x) => { forward(net, x); return [net.ws.a[1][0], net.ws.a[1][1]]; };
              const W2 = net.W[1], b2 = net.b[1][0]; outLine = [W2[0], W2[1], b2]; lo = [-1.08, -1.08]; hi = [1.08, 1.08];
            }
            const thr = mode === 'hand' ? 0.5 : 0.5;
            sL.raster((x, y) => { const f = F([x, y]), u = Math.round(clamp(Math.abs(f - thr) * 1.6, 0, 1) * 31); return f >= thr ? lutB[u] : lutA[u]; }, { res: 3, key: mode === 'hand' ? 'hand' : 'tr' + t.toFixed(3) + seedS.value });
            sL.contour((x, y) => F([x, y]) - thr, 0, { color: 'ink', width: 2, res: 80 });
            sR.setView([lo[0], hi[0]], [lo[1], hi[1]]); sR.setLabels('$h_1$', '$h_2$'); tR(mode === 'hand' ? 'hidden layer $(h_1,h_2)$: the folded input grid' : 'hidden layer $(h_1,h_2)$ during training');
            // image of the input grid
            for (let k = 0; k <= 8; k++) { const c = -0.5 + (2 * k) / 8, l1 = [], l2 = []; for (let i = 0; i <= 60; i++) { const s = -0.5 + (2 * i) / 60; l1.push(Hm([c, s])); l2.push(Hm([s, c])); } sR.path(l1, { color: 'faint', width: 1 }); sR.path(l2, { color: 'faint', width: 1 }); }
            // the output unit's boundary in hidden space
            const [a1, a2, c0] = outLine, z0 = mode === 'hand' ? 0.5 : 0; // hand: f = h1 - 2 h2 ≥ 0.5 ; trained: logit ≥ 0
            const cst = mode === 'hand' ? -0.5 : c0, nn = Math.hypot(a1, a2) || 1, p0 = [(-cst * a1) / (nn * nn), (-cst * a2) / (nn * nn)], dir = [-a2 / nn, a1 / nn];
            void z0; sR.line(p0[0] - 9 * dir[0], p0[1] - 9 * dir[1], p0[0] + 9 * dir[0], p0[1] + 9 * dir[1], { color: 'ink', width: 2.2 });
            PTS.forEach(([x, y, c], i) => { const h = Hm([x, y]); sR.dot(h[0], h[1], { r: 7 - i * 0.6, color: c ? 'green' : 'purple' }); });
            const pred = PTS.map(([x, y]) => (F([x, y]) >= thr ? 1 : 0));
            wrongs = pred.reduce((s, p, i) => s + (p !== PTS[i][2] ? 1 : 0), 0);
            extra = mode === 'hand' ? `outputs $f=${PTS.map(([x, y]) => hand([x, y])[2]).join(',\\,')}$ on $(0,0),(1,1),(0,1),(1,0)$ · hidden images $(0,0),(2,1),(1,0),(1,0)$ · **${wrongs} mistakes**`
              : `step ${S.state.T.iter} · loss ${S.state.T.loss.toFixed(4)} · outputs ${PTS.map(([x, y]) => F([x, y]).toFixed(2)).join(', ')} · **${wrongs} mistake${wrongs === 1 ? '' : 's'}**` + (S.state.T.iter > 500 && wrongs ? ' — stuck in a poor local minimum: try another seed' : '');
          }
          for (const [x, y, c] of PTS) { sL.dot(x, y, { r: 8, color: c ? 'green' : 'purple' }); sL.text(String(c), x, y, { align: 'center', size: 10.5, color: 'panel', weight: 700, halo: false }); }
          info = extra;
        }, { period: 14, once: true, still: 9 });
        v.legend([['purple', 'label 0', { dot: true }], ['green', 'label 1', { dot: true }], ['ink', 'decision boundary']]);
        v.readout(() => info || '');
      },
    },
    // ───────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Model',
      name: 'Deep feedforward network',
      statement: String.raw`A **deep feedforward network** (multilayer perceptron) of depth $L$ composes affine maps and coordinatewise activations:
$$h^{(0)}=x,\qquad h^{(\ell)}=\sigma\bigl(W^{(\ell)}h^{(\ell-1)}+b^{(\ell)}\bigr)\ (\ell=1,\dots,L-1),\qquad f(x)=W^{(L)}h^{(L-1)}+b^{(L)},$$
with $W^{(\ell)}\in\R^{n_\ell\times n_{\ell-1}}$; the $n_\ell$ are the **widths** and $f=A_L\circ\sigma\circ A_{L-1}\circ\cdots\circ\sigma\circ A_1$. Composing two networks is again a network whose depth is the sum of the depths. For ReLU networks on an interval, if $g$ has $p$ linear pieces and $h$ has $q$, then $h\circ g$ has at most $p\,q$ pieces — and exactly $p\,q$ when each piece of $g$ sweeps the whole domain of $h$, so composition multiplies piece counts where addition (a wider layer) only adds them.`,
      idea: String.raw`On each linear piece of $g$, the composite $h\circ g$ is $h$ run over an interval — forwards if $g$ increases there, backwards if it decreases — so it inherits a copy of every piece of $h$ that the interval covers. A $g$ that folds $[0,1]$ onto itself $p$ times thus stamps out $p$ copies of $h$. Iterating, $k$ folding layers of constant width give $p^k$ pieces, while a single hidden layer with the same number of units gives only linearly many (1.3); this is the mechanism behind depth separation (2.6) and the region counts of 2.7.`,
      caption: String.raw`Top left: a two-unit ReLU network $g$ on $[0,1]$ — drag its apex and end values. Top right: a network $h$ with four knots — drag them. Bottom: the composite $h\circ g^{\circ k}$ for the chosen depth $k$; each segment is coloured by the piece of $h$ it copies, so you can see $h$ replicated, mirrored on the falling pieces of $g$. The readout compares the exact piece counts with the product bound.`,
      deps: ['deep-1.3'],
      refs: ['Prince §4.3', 'Goodfellow §6.4'],
      tags: ['deep network', 'composition'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Multilayer_perceptron' },
      viz(v) {
        const kS = v.slider('folding layers $k$', 1, 5, 2, { int: true });
        const sG = v.stage({ x: [0, 1], y: [-0.08, 1.08], height: 220, axes: 'box', gutter: true, xlabel: '$x$', title: 'first network $g(x)=g(0)+s_1x+(s_2-s_1)\\,\\mathrm{ReLU}(x-p)$' });
        const sH = v.stage({ x: [0, 1], y: [-0.1, 1.1], height: 220, axes: 'box', gutter: true, xlabel: '$u$', title: 'second network $h$' });
        const sC = v.stage({ x: [0, 1], y: [-0.1, 1.1], height: 250, full: true, axes: 'box', gutter: true, xlabel: '$x$', title: 'composite $h\\circ g\\circ\\cdots\\circ g$ ($k$ copies of $g$)' });
        const G0 = sG.handle(0, 0, { color: 'accent', constrain: (x, y) => [0, clamp(y, 0, 1)] });
        const GA = sG.handle(0.42, 1, { color: 'accent', constrain: (x, y) => [clamp(x, 0.06, 0.94), clamp(y, 0, 1)] });
        const G1 = sG.handle(1, 0, { color: 'accent', constrain: (x, y) => [1, clamp(y, 0, 1)] });
        const HK = [[0, 0.1], [0.3, 0.9], [0.62, 0.25], [1, 0.75]].map(([x, y], i) => sH.handle(x, y, { color: CYC[i + 1], constrain: (px, py) => [i === 0 ? 0 : i === 3 ? 1 : clamp(px, 0.05, 0.95), clamp(py, -0.1, 1.1)] }));
        let info = null;
        v.render(() => {
          const g = plSimplify([[0, G0.y], [GA.x, GA.y], [1, G1.y]]);
          const hk = HK.map((h) => [h.x, h.y]).sort((a, b) => a[0] - b[0]); const h = plSimplify(hk);
          sG.path(g, { color: 'accent', width: 3 }); sG.line(0, 0, 1, 1, { color: 'faint', width: 1, dash: [4, 4] });
          for (let i = 0; i < hk.length - 1; i++) sH.line(hk[i][0], hk[i][1], hk[i + 1][0], hk[i + 1][1], { color: CYC[i + 1], width: 3.2 });
          // composite
          let gk = g; for (let k = 1; k < kS.value; k++) gk = plCompose(g, gk);
          const lo = Math.min(...gk.map((p) => p[1])), hi = Math.max(...gk.map((p) => p[1]));
          sH.vband(lo, hi, { color: 'accent', alpha: 0.08 });
          const comp = plCompose(h, gk);
          for (let i = 0; i < comp.length - 1; i++) {
            const [xa, ya] = comp[i], [xb, yb] = comp[i + 1], u = plEval(gk, (xa + xb) / 2);
            let j = 0; while (j < hk.length - 2 && u > hk[j + 1][0]) j++;
            sC.line(xa, ya, xb, yb, { color: CYC[j + 1], width: 2.6 });
          }
          sC.path(gk, { color: 'accent', width: 1, alpha: 0.45, dash: [3, 3] });
          if (comp.length < 140) sC.dots(comp.map((p) => [p[0], p[1]]), { r: 1.8, color: 'ink' });
          info = { pg: g.length - 1, ph: h.length - 1, pgk: plPieces(gk), pc: comp.length - 1, k: kS.value };
        });
        v.legend([['accent', '$g^{\\circ k}$ (dashed, bottom)', { dash: true }], ['orange', 'piece 1 of $h$'], ['green', 'piece 2'], ['purple', 'piece 3']]);
        v.readout(() => info && String.raw`pieces: $g$ has ${info.pg}, $h$ has ${info.ph}, $g^{\circ ${info.k}}$ has ${info.pgk} (bound $${info.pg}^{${info.k}}=${info.pg ** info.k}$), composite $h\circ g^{\circ ${info.k}}$ has **${info.pc}** (bound $${info.ph}\times${info.pg ** info.k}=${info.ph * info.pg ** info.k}$) — built from only $2k+3=${2 * info.k + 3}$ ReLU units`);
      },
    },
  ],
};
