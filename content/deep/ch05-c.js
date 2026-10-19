import {makeScaleInvariantLogistic} from './normalization-source.shared.js';
// Deep Learning Theory — Chapter 5: Depth, initialization and normalization (items 5.10–5.13; 5.1–5.5 in ch05.js, 5.6–5.9 in ch05-b.js)
//
// 5.10 and 5.12 run exact gradient descent on small explicit models (a batch-normalized linear unit; a scalar linear RNN whose loss has a
// cliff). 5.11 is a matrix picture of the two normalizations. 5.13 re-creates, at toy scale, the experiment of Fig. 1 of the ResNet paper and
// shows the paper's own numbers (Tables 2 and 6) beside it.
import { clamp, mnus, memo, rand, hashStr, toyData, makeRace, drawPoints, regionRaster, dnetProb } from './ch05.shared.js';

const pct = (x) => (100 * x).toFixed(0) + '%';
const last = (a) => a[a.length - 1];
const sp = (x) => (Math.abs(x) >= 1e3 || (x !== 0 && Math.abs(x) < 1e-3) ? String.raw`${(x / 10 ** Math.floor(Math.log10(Math.abs(x)))).toFixed(1)}\times10^{${Math.floor(Math.log10(Math.abs(x)))}}` : x.toPrecision(3));

export default {
  collection: 'deep',
  chapter: 5,
  items: [
    // ───────────────────────────────────────────────────────────── 5.10
    {
      num: '5.10',
      kind: 'Concept',
      name: 'Scale invariance and the effective learning rate',
      statement: String.raw`Suppose the loss is **scale invariant** in a weight vector $w\ne0$: $\ell(cw)=\ell(w)$ for all $c>0$ (for ideal batch normalization with zero additive variance constant and nonzero batch variance; a fixed nonzero variance constant breaks exact invariance). Then differentiating $c\mapsto\ell(cw)$ at $c=1$ gives $\langle\nabla\ell(w),w\rangle=0$, and $\nabla\ell(cw)=\tfrac1c\nabla\ell(w)$. Consequently, for gradient descent $w_{t+1}=w_t-\eta\nabla\ell(w_t)$,
$$\|w_{t+1}\|^2=\|w_t\|^2+\eta^2\|\nabla\ell(w_t)\|^2\ \ge\ \|w_t\|^2,$$
the weight norm never decreases, and the movement of the *direction* $w/\|w\|$ is governed by the **effective learning rate** $\eta_{\rm eff}=\eta/\|w\|^2$ (the gradient on the unit sphere is $\|w\|$ times the gradient at $w$, and a step of length $\eta\|\nabla\ell\|$ turns the direction by an angle of order $\eta\|\nabla\ell\|/\|w\|$). With weight decay $\lambda$, $w_{t+1}=(1-\eta\lambda)w_t-\eta\nabla\ell(w_t)$, a heuristic stationary balance, when $0<\eta\lambda<2$ and directional-gradient statistics stabilize, gives $\|w\|^4\approx\eta\|\tilde g\|^2/(2\lambda)$ with $\tilde g$ the gradient on the unit sphere. This small-step balance need not describe convergence of every run.`,
      idea: String.raw`Euler's theorem for homogeneous functions of degree 0 gives the orthogonality of gradient and weights, and Pythagoras then gives the norm identity: each step moves along a tangent direction, so it can only lengthen the radius. Arora, Li and Lyu analyze this automatic change of effective rate. With decay, the exact squared-norm update is $(1-\eta\lambda)^2\|w\|^2+\eta^2\|g\|^2$; replacing the directional-gradient magnitude by a stationary value and taking $\eta\lambda\ll1$ gives the displayed heuristic balance. A learned normalization scale does not itself destroy invariance with respect to the incoming weights.`,
      caption: String.raw`A single logistic unit on 40 two-dimensional points (two overlapping classes, centred), trained by gradient descent from $w_0$ (gold). With **BN** the unit's output is standardized over the data before the loss, so the loss (heat map) depends only on the direction of $w$: it is constant along rays. Top left: the path in weight space. Top right: $\|w\|^2$ with the identity $\|w_0\|^2+\eta^2\sum\|g\|^2$ (dashed), which holds exactly when weight decay is off. Bottom: the effective learning rate $\eta/\|w\|^2$ and the loss. Turn on weight decay to see the norm stop growing; switch to the plain unit and the gradient is no longer orthogonal to $w$ (loss falls partly by growing the norm).`,
      deps: ['deep-5.9'],
      refs: ['Arora, Li and Lyu, arXiv 1812.03981v1, Definition 2.1, Lemmas 2.2 / 2.4 with complete proofs, pp. 3–6; zero-variance-constant caveat p. 3; decay balance is derived here as a heuristic'],
      tags: ['scale invariance', 'weight decay', 'learning rate'],
      credit: 'Arora, Li & Lyu, 2018 preprint (auto rate tuning)',
      scope: String.raw`Exact for a differentiable scale-invariant loss at a nonzero weight vector. The per-step identity also holds for stochastic gradients when each sampled loss is scale invariant. It does not require fixing every other parameter across training steps. This display uses zero-epsilon batch normalization, with the zero-variance point excluded. The decay-balance formula is a heuristic.`,
      links: { arxiv: 'https://arxiv.org/abs/1812.03981' },
      viz(v) {
        const unitS = v.select('unit', [{ value: 'bn', label: 'batch-normalized' }, { value: 'plain', label: 'plain linear' }], 'bn');
        const eta = v.slider('learning rate $\\eta$', 0.02, 3, 0.05, { log: true, sig: 2 });
        const lam = v.slider('weight decay $\\lambda$', 0, 0.03, 0, { step: 0.001 });
        const rho = v.slider('initial norm $\\|w_0\\|$', 0.2, 3, 0.7, { step: 0.05 });
        const T = 400, R = 3.2, GAM = 3;
        const rr = rand(hashStr('scaleinv')), X = [], Y = [];
        for (let i = 0; i < 40; i++) { const c = i % 2 ? 1 : -1; X.push([c * 0.9 + rr.normal() * 1.1, c * 0.5 + rr.normal() * 1.1]); Y.push(c); }
        const lossGrad = makeScaleInvariantLogistic(X,Y,GAM);
        const sP = v.stage({ x: [-R, R], y: [-R, R], equal: true, height: 290, axes: 'box', gutter: true, xlabel: '$w_1$', ylabel: '$w_2$', weight: 1, minWidth: 380, title: 'weight plane: loss and path' });
        const sN = v.stage({ x: [0, T], y: [0, 4], height: 290, axes: 'box', gutter: true, xlabel: 'step', ylabel: '$\\|w\\|^2$', weight: 1, minWidth: 380, title: 'squared weight norm' });
        const sE = v.stage({ x: [0, T], y: [1e-3, 10], ylog: true, height: 290, axes: 'box', gutter: true, xlabel: 'step', ylabel: '$\\eta/\\|w\\|^2$', weight: 1, minWidth: 380, title: 'effective learning rate' });
        const sL = v.stage({ x: [0, T], y: [0.05, 1], ylog: true, height: 290, axes: 'box', gutter: true, xlabel: 'step', ylabel: 'loss', weight: 1, minWidth: 380, title: 'loss' });
        const w0 = sP.handle(-0.5, -0.45, { color: 'gold', r: 8, label: '$w_0$' });
        const mc = memo(); let info = null;
        v.render(() => {
          const bn = unitS.value === 'bn', e = eta.value, l = lam.value, rh = rho.value;
          const ang = Math.atan2(w0.y, w0.x); w0.set(rh * Math.cos(ang), rh * Math.sin(ang)); // the handle gives the direction, the slider the norm
          let w = [w0.x, w0.y]; const path = [w.slice()], nrm = [w[0] ** 2 + w[1] ** 2], loss = [], eff = [], pred = [nrm[0]], cosv = []; let acc = nrm[0], maxCos = 0;
          for (let t = 0; t <= T; t++) {
            const { L, g } = lossGrad(w, bn), n2 = w[0] ** 2 + w[1] ** 2, gn = Math.hypot(g[0], g[1]);
            loss.push(L); eff.push(e / n2); if (gn > 1e-12) maxCos = Math.max(maxCos, Math.abs(g[0] * w[0] + g[1] * w[1]) / (gn * Math.sqrt(n2)));
            if (t === T) break;
            acc += e * e * (g[0] ** 2 + g[1] ** 2); pred.push(acc);
            w = [(1 - e * l) * w[0] - e * g[0], (1 - e * l) * w[1] - e * g[1]]; path.push(w.slice()); nrm.push(w[0] ** 2 + w[1] ** 2);
          }
          sP.heat((x, y) => lossGrad([x, y], bn).L, { range: [0.3, 0.9], cmap: 'theme', res: 4, key: 'ld' + unitS.value });
          sP.clip(() => { sP.path(path, { color: 'accent', width: 1.8 }); });
          sP.dot(path[path.length - 1][0], path[path.length - 1][1], { r: 4, color: 'green' });
          const ymax = Math.max(1, ...nrm.slice(0, T + 1)) * 1.1; sN.setView([0, T], [0, ymax]);
          sN.path(nrm.map((y, t) => [t, y]), { color: 'accent', width: 2.2 });
          if (l === 0 && bn) sN.path(pred.map((y, t) => [t, y]), { color: 'muted', dash: true, width: 1.5 });
          sE.path(eff.map((y, t) => [t, y]), { color: 'orange', width: 2.2 });
          sL.path(loss.map((y, t) => [t, Math.max(0.05, y)]), { color: 'red', width: 2.2 });
          info = { n0: nrm[0], nT: last(nrm), e0: eff[0], eT: last(eff), maxCos, bn, pred: last(pred), lT: last(loss), l };
        });
        v.legend([['accent', '$\\|w_t\\|^2$ and path'], ['muted', '$\\|w_0\\|^2+\\eta^2\\sum\\|g\\|^2$ (no decay)', { dash: true }], ['orange', '$\\eta/\\|w\\|^2$'], ['red', 'loss']]);
        v.readout(() => info && String.raw`$\|w\|^2$: ${v.fix(info.n0, 2)} → **${v.fix(info.nT, 2)}** after ${T} steps` + (info.l === 0 && info.bn ? String.raw` · predicted by the identity ${v.fix(info.pred, 2)} (exact when $g\perp w$)` : '') + ` · effective rate $\\eta/\\|w\\|^2$: ${v.fix(info.e0, 2)} → **${v.fix(info.eT, 3)}**` + `\n` +
          String.raw`largest $|\cos\angle(g,w)|$ along the run: ${v.fix(info.maxCos, 4)} ` + (info.bn ? `(scale-invariant loss: always 0, so the norm can only grow without decay)` : `(plain unit: the loss depends on the norm too, gradient not orthogonal)`) + ` · final loss ${v.fix(info.lT, 3)}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 5.11
    {
      num: '5.11',
      kind: 'Method',
      name: 'Layer normalization',
      statement: String.raw`For one example's feature vector $x\in\mathbb R^d$, **layer normalization** computes
$$\mu=\frac1d\sum_jx_j,\quad\sigma^2=\frac1d\sum_j(x_j-\mu)^2,\qquad y_j=\gamma_j\,\frac{x_j-\mu}{\sqrt{\sigma^2+\epsilon}}+\beta_j,$$
with learned gain $\gamma$ and bias $\beta$. The statistics are taken over the **features of a single example**, not over the batch as in batch normalization (5.9). Hence (i) the output for an example does not depend on the other examples in its batch, and train and test computations are identical; (ii) it works for a batch of one; (iii) $y$ is unchanged if $x$ is replaced by $ax+b\mathbf 1$ for any $a>0$ and any $b$: the layer is invariant to rescaling and re-centering of its input (and of its weight matrix).`,
      idea: String.raw`Batch statistics are a poor fit for recurrent and attention models, where sequence lengths vary, batches can be small and statistics at each time step would have to be kept separately; moving the averaging axis from examples to features removes the dependence on the batch while still fixing the scale and offset of each layer's input. The invariance is immediate from the formula: shifting by $b\mathbf1$ moves $\mu$ by $b$ and leaves $x-\mu$ unchanged, and multiplying by $a>0$ multiplies the numerator and $\sigma$ by $a$ (up to the $\epsilon$). Ba, Kiros and Hinton (2016) introduced it for recurrent networks; it is the normalization of the transformer block (9.9).`,
      caption: String.raw`A batch of $B$ examples (rows) with $d=8$ features (columns). Left: the input $X$. Middle: batch normalization standardizes each **column** over the batch. Right: layer normalization standardizes each **row**. Rescale or shift example 1 (gold outline) with the sliders, or draw new other examples: the layer-normalized rows of the other examples never change, and example 1's own LN row is invariant to a shift $b$ and approximately invariant to a scale $a>0$ (the stabilizing epsilon breaks exact scale invariance), while the batch-normalized output of every example moves. With $B=1$ the batch-norm panel is all zeros.`,
      deps: ['deep-5.9'],
      refs: ['Prince §12.4'],
      tags: ['normalization', 'transformers', 'invariance'],
      credit: 'Ba, Kiros & Hinton, 2016',
      scope: String.raw`Exact formulas. The $\epsilon$ makes the invariance to the scale $a$ approximate for very small $a$ (here $\epsilon=10^{-5}$); $\gamma$ and $\beta$ are fixed to 1 and 0 in the picture.`,
      links: { arxiv: 'https://arxiv.org/abs/1607.06450' },
      viz(v) {
        const Bs = v.slider('batch size $B$', 1, 8, 6, { int: true });
        const aS = v.slider('scale $a$ of example 1', 0.2, 5, 1, { log: true, sig: 2 });
        const bS = v.slider('shift $b$ of example 1', -3, 3, 0, { step: 0.1 });
        const seed = { v: 1 }; v.button('new other examples', () => { seed.v++; });
        const D = 8, EPS = 1e-5;
        const mk = (Bn) => v.stage({ x: [0, D], y: [0, 8], height: 300, axes: false, weight: 1, minWidth: 250, aspect: 0.9 });
        const sX = mk(), sB = mk(), sL = mk();
        sX.setTitle('input $X$'); sB.setTitle('batch norm: columns standardized'); sL.setTitle('layer norm: rows standardized');
        const mc = memo(); let info = null;
        const bnorm = (X) => { const B = X.length; return X.map((row, i) => row.map((_, j) => { let m = 0; for (let k = 0; k < B; k++) m += X[k][j]; m /= B; let s = 0; for (let k = 0; k < B; k++) s += (X[k][j] - m) ** 2; s /= B; return (X[i][j] - m) / Math.sqrt(s + EPS); })); };
        const lnorm = (X) => X.map((row) => { const m = row.reduce((a, b) => a + b, 0) / D, s = row.reduce((a, b) => a + (b - m) ** 2, 0) / D; return row.map((x) => (x - m) / Math.sqrt(s + EPS)); });
        const dist = (A, Bm) => Math.sqrt(A.reduce((s, row, i) => s + row.reduce((t, x, j) => t + (x - Bm[i][j]) ** 2, 0), 0));
        function cells(s, M, Bn, colorFn, fmt) {
          for (let i = 0; i < Bn; i++) for (let j = 0; j < D; j++) {
            const y1 = 8 - i * (8 / Bn), y0 = y1 - 8 / Bn; s.rect(j + 0.04, y0 + 0.04, j + 0.96, y1 - 0.04, { fill: colorFn(M[i][j]), fillAlpha: 1, stroke: false, radius: 3 });
            s.text(fmt(M[i][j]), j + 0.5, (y0 + y1) / 2, { align: 'center', baseline: 'middle', size: Bn > 6 ? 9.5 : 11, color: 'ink' });
          }
          const y1 = 8, y0 = 8 - 8 / Bn; s.rect(0.02, y0 + 0.02, D - 0.02, y1 - 0.02, { color: 'gold', width: 2, fill: false });
        }
        v.render(() => {
          const Bn = Bs.value, a = aS.value, b = bS.value;
          const base = mc('b' + Bn + '|' + seed.v, () => { const r = rand(hashStr('ln' + seed.v)); return Array.from({ length: 8 }, (_, i) => { const m = r.normal() * 1.2, sc = Math.exp(r.normal() * 0.5); return Array.from({ length: D }, () => m + sc * r.normal()); }); }).slice(0, Bn);
          const X0 = base.map((row) => row.slice()), X1 = base.map((row, i) => (i === 0 ? row.map((x) => a * x + b) : row.slice()));
          // example 1 = the first row; the other rows are untouched
          const cx = (x) => v.diverge(clamp(x / 3, -1, 1)), cn = (x) => v.diverge(clamp(x / 2.2, -1, 1)), f1 = (x) => mnus(x.toFixed(1)), f2 = (x) => mnus(x.toFixed(2));
          const BN1 = bnorm(X1), LN1 = lnorm(X1), BN0 = bnorm(X0), LN0 = lnorm(X0);
          cells(sX, X1, Bn, cx, f1); cells(sB, BN1, Bn, cn, f1); cells(sL, LN1, Bn, cn, f1);
          const rowsOther = (A, Bm) => (Bn > 1 ? Math.sqrt(A.slice(1).reduce((s, row, i) => s + row.reduce((t, x, j) => t + (x - Bm[i + 1][j]) ** 2, 0), 0)) : 0);
          info = { Bn, bnOthers: rowsOther(BN1, BN0), lnOthers: rowsOther(LN1, LN0), bnSelf: dist([BN1[0]], [BN0[0]]), lnSelf: dist([LN1[0]], [LN0[0]]), a, b, zero: BN1[0].every((x) => Math.abs(x) < 1e-3) && Bn === 1 };
        });
        v.legend([['accent', 'blue: below the average of the standardized set'], ['red', 'red: above']]);
        v.readout(() => info && String.raw`after rescaling/shifting example 1 by $a=${v.fix(info.a, 2)}$, $b=${v.fix(info.b, 1)}$: change of **its own** output: batch norm ${v.fix(info.bnSelf, 3)}, layer norm ${v.fix(info.lnSelf, 4)}` + `\n` +
          String.raw`change of the **other ${info.Bn - 1} examples'** outputs: batch norm ${v.fix(info.bnOthers, 3)}, layer norm ${v.fix(info.lnOthers, 4)} (exactly 0: no batch dependence)` + (info.Bn === 1 ? ` · $B=1$: the batch-norm output is identically 0, the information is lost` : ''));
      },
    },
    // ───────────────────────────────────────────────────────────── 5.12
    {
      num: '5.12',
      kind: 'Method',
      name: 'Gradient clipping',
      statement: String.raw`**Clipping by norm.** Given a threshold $c>0$, replace the gradient $g$ by
$$\tilde g=g\cdot\min\Bigl(1,\frac{c}{\|g\|}\Bigr),$$
and take the step $\theta\leftarrow\theta-\eta\tilde g$. The direction of the step is unchanged and its length is at most $\eta c$, whatever the gradient does. (Clipping each coordinate to $[-c,c]$ instead is also used but changes the direction.) In loss landscapes with **cliffs** — steep walls beside flat valleys, as arise when the same weights are multiplied $T$ times in a recurrent network (5.1) — an unclipped step of length $\eta\|g\|$ can throw the iterate far from the valley and undo much of the progress made, while a clipped step still points downhill and stays local.`,
      idea: String.raw`Near a cliff the gradient is huge, so the first-order model is trustworthy only in a tiny neighbourhood; the step $\eta\|g\|$ prescribed by plain gradient descent is then wildly longer than that neighbourhood. Bounding the step length by $\eta c$ keeps the update within the region where the local direction is informative, while far from cliffs ($\|g\|\le c$) clipping does nothing and plain gradient descent is recovered. Pascanu, Mikolov and Bengio (2013) proposed the norm-clipping rule for recurrent networks and explained the cliffs geometrically; in the example here the loss of a scalar linear RNN $h_T=u\sum_{k<T}w^k$ rises like $w^{2T}$ for $w>1$, a wall of height $e^{O(T)}$.`,
      caption: String.raw`A scalar linear RNN $h_t=wh_{t-1}+u$ (input 1 at each of $T=30$ steps) is trained on the single target $h_T=2$, loss $\tfrac12(h_T-2)^2$, parameters $(w,u)$. Left: log-loss in the $(w,u)$ plane, with the valley floor $uS(w)=2$ in green; drag the gold start point. Unclipped gradient descent (red) takes one enormous step from the wall at $w>1$ and lands far from the valley; the clipped run (blue) slides down to the floor. Middle: loss against step. Right: length of each step against the maximum $\eta c$ (dashed). Change the threshold $c$ or the step $\eta$, or switch to value clipping, and see when clipping stops being enough.`,
      deps: ['deep-5.1'],
      refs: ['Goodfellow §10.11'],
      tags: ['clipping', 'exploding gradients', 'RNN'],
      credit: 'Pascanu, Mikolov & Bengio, 2013',
      scope: String.raw`A heuristic safeguard rather than a convergent method on its own: it leaves the fixed points of gradient descent unchanged, but with a small threshold it can slow progress, and it does nothing about vanishing gradients.`,
      links: { pmlr: 'https://proceedings.mlr.press/v28/pascanu13.html', arxiv: 'https://arxiv.org/abs/1211.5063' },
      viz(v) {
        const eta = v.slider('step size $\\eta$', 0.0005, 0.01, 0.002, { log: true, sig: 2 });
        const cS = v.slider('clip threshold $c$', 1, 400, 20, { log: true, sig: 2 });
        const modeS = v.select('clip by', [{ value: 'norm', label: 'norm' }, { value: 'value', label: 'value' }], 'norm');
        const T = 30, YS = 2, STEPS = 60;
        const S = (w) => { let s = 0, p = 1; for (let k = 0; k < T; k++) { s += p; p *= w; } return s; };
        const dS = (w) => { let s = 0, p = 1; for (let k = 1; k < T; k++) { s += k * p; p *= w; } return s; };
        const loss = (w, u) => 0.5 * (u * S(w) - YS) ** 2, grad = (w, u) => { const e = u * S(w) - YS; return [e * u * dS(w), e * S(w)]; };
        const sP = v.stage({ x: [-1.2, 1.3], y: [-0.5, 0.8], height: 340, axes: 'box', gutter: true, xlabel: '$w$', ylabel: '$u$', weight: 1.2, minWidth: 300, title: 'log-loss in the parameter plane' });
        const sL = v.stage({ x: [0, STEPS], y: [1e-4, 1e6], ylog: true, height: 340, axes: 'box', gutter: true, xlabel: 'step', ylabel: 'loss', weight: 0.9, minWidth: 250, title: 'loss' });
        const sS = v.stage({ x: [0, STEPS], y: [1e-5, 1e6], ylog: true, height: 340, axes: 'box', gutter: true, xlabel: 'step', ylabel: 'step length', weight: 0.9, minWidth: 250, title: 'length of each step' });
        const h0 = sP.handle(1.03, 0.2, { color: 'gold', r: 8, label: 'start', labelPos: 'nw' });
        function run(w, u, e, c, mode) {
          const path = [[w, u]], ls = [loss(w, u)], st = []; let dead = false;
          for (let i = 0; i < STEPS; i++) {
            let g = grad(w, u); const n = Math.hypot(g[0], g[1]);
            if (c) { if (mode === 'norm') { if (n > c) g = g.map((x) => (x * c) / n); } else g = g.map((x) => Math.max(-c, Math.min(c, x))); }
            const dw = -e * g[0], du = -e * g[1]; w += dw; u += du;
            if (!isFinite(w) || !isFinite(u) || Math.abs(w) > 1e30 || Math.abs(u) > 1e30) { dead = true; break; }
            path.push([w, u]); ls.push(loss(w, u)); st.push(Math.hypot(dw, du));
          }
          return { path, ls, st, dead };
        }
        let info = null;
        v.render(() => {
          const e = eta.value, c = cS.value, mode = modeS.value;
          sP.heat((w, u) => Math.log10(loss(w, u) + 1e-4), { range: [-3, 4], cmap: 'theme', res: 4, key: 'cliff' });
          const floor = []; for (let i = 0; i <= 200; i++) { const w = -1.2 + (2.5 * i) / 200, s = S(w); if (Math.abs(s) > 1e-9) floor.push([w, YS / s]); }
          sP.clip(() => sP.path(floor.map((p, i) => (Math.abs(p[1]) > 5 || (i > 0 && Math.abs(p[1] - floor[i - 1][1]) > 1) ? null : p)), { color: 'green', width: 2 }));
          sP.vline(1, { color: 'faint', dash: true });
          const A = run(h0.x, h0.y, e, 0, mode), Bc = run(h0.x, h0.y, e, c, mode);
          sP.clip(() => { sP.path(A.path, { color: 'red', width: 1.8 }); sP.path(Bc.path, { color: 'accent', width: 2 }); });
          sP.dots(A.path.slice(0, 8).filter((p) => Math.abs(p[0]) < 1.3 && Math.abs(p[1]) < 0.8), { r: 3, color: 'red' });
          sP.dots(Bc.path.filter((p, i) => i % 3 === 0), { r: 2.5, color: 'accent' });
          sL.path(A.ls.map((y, t) => [t, Math.min(1e6, Math.max(1e-4, y))]), { color: 'red', width: 2 }); sL.path(Bc.ls.map((y, t) => [t, Math.min(1e6, Math.max(1e-4, y))]), { color: 'accent', width: 2 });
          sS.path(A.st.map((y, t) => [t, Math.min(1e6, Math.max(1e-5, y))]), { color: 'red', width: 2 }); sS.path(Bc.st.map((y, t) => [t, Math.max(1e-5, y)]), { color: 'accent', width: 2 });
          sS.hline(e * c * (mode === 'value' ? Math.SQRT2 : 1), { color: 'muted', dash: true, width: 1.4 });
          const g0 = grad(h0.x, h0.y), n0 = Math.hypot(g0[0], g0[1]);
          info = { A, B: Bc, n0, e, c, mode, lA: last(A.ls), lB: last(Bc.ls) };
        });
        v.legend([['red', 'unclipped gradient descent'], ['accent', 'clipped'], ['green', 'valley floor $uS(w)=2$'], ['muted', 'dashed: maximal step $\\eta c$', { dash: true }]]);
        v.readout(() => info && String.raw`start: loss ${sp(loss(h0.x, h0.y))}, $\|g\|=${sp(info.n0)}$ → unclipped first step has length $\eta\|g\|=${sp(info.e * info.n0)}$; clipped step ≤ $\eta c=${sp(info.e * info.c)}$` + `\n` +
          `after ${STEPS} steps: unclipped ` + (info.A.dead ? `**diverged** (overflow)` : `loss $${sp(info.lA)}$`) + ` · clipped (${info.mode}) ` + (info.B.dead ? `**diverged**` : `loss $${sp(info.lB)}$`) + (info.n0 * info.e < 0.3 ? ` · the start is gentle enough that clipping is idle: drag it onto the wall at $w>1$` : ''));
      },
    },
    // ───────────────────────────────────────────────────────────── 5.13
    {
      num: '5.13',
      kind: 'Paper',
      name: 'Deep residual learning for image recognition',
      paper: { authors: 'Kaiming He, Xiangyu Zhang, Shaoqing Ren and Jian Sun', year: 2016, title: 'Deep Residual Learning for Image Recognition', venue: 'Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (CVPR) 2016: 770–778', doi: '10.1109/CVPR.2016.90' },
      introduces: ['deep-5.6', 'deep-5.7'],
      statement: String.raw`He, Zhang, Ren and Sun (2015; CVPR 2016) observed that deeper plain convolutional networks have **higher training error** than shallower ones (on CIFAR-10, 56 layers against 20, Fig. 1 of the paper; on ImageNet, 34 layers against 18, Table 2), and proposed learning the residual $F(x)=H(x)-x$ with identity shortcuts, $y=F(x)+x$, so that the identity is the default solution. With the shortcuts the degradation disappears: the 34-layer ResNet beats the 18-layer one, ResNets of 152 layers (8 times deeper than VGG) are trained for ILSVRC, and an ensemble reaches 3.57% top-5 error on the ImageNet test set (first place in ILSVRC 2015 classification); on CIFAR-10 the error falls steadily from 20 to 110 layers (Table 6: 8.75% at 20, 7.51%, 7.17%, 6.97%, then 6.43% at 110 layers) and a 1202-layer net still trains (7.93%).`,
      idea: String.raw`Before this paper, vanishing and exploding signals (5.1) were thought largely solved by normalized initialization (5.2, 5.3) and batch normalization (5.9), and the open question was why adding layers to a trainable network still hurt. The paper's answer — a construction argument, not a theorem — is that a deeper net could copy the shallower net and make the added layers identities, so the optimizer's failure to find such a solution shows that identity mappings are hard to learn with stacked nonlinear layers; reparametrizing each block as a residual ($F+x$) makes them easy (push $F$ to 0). The paper introduced the **residual block**, the **identity shortcut**, bottleneck blocks for the deep ImageNet models, and the claim that depth could be pushed an order of magnitude further (see 5.7 for the gradient view, 5.8 for the ODE view).`,
      caption: String.raw`Left and middle: a **toy-scale** re-creation of the paper's Fig. 1, not its data: plain tanh networks of 20 and 56 layers (thin) are trained on 90 points of a spiral (training error, left; test error on 400 fresh points, middle), then the same networks with identity shortcuts (bold). As in the paper, the deeper plain network is worse on the training set; adding shortcuts reverses this. The result depends on the random seed (change it: some seeds leave the 56-layer residual net slow, which is also true of real ResNets without careful initialization). Right: the **paper's own numbers**: ImageNet top-1 validation error of plain and residual 18- and 34-layer networks (Table 2) or the CIFAR-10 test error of ResNets of 20 to 1202 layers (Table 6).`,
      deps: ['deep-5.1', 'deep-5.9', 'deep-8.7'],
      see: ['deep-5.6', 'deep-5.7'],
      refs: [],
      tags: ['residual networks', 'ImageNet', 'depth'],
      credit: 'He, Zhang, Ren & Sun, 2015 (arXiv 1512.03385); CVPR 2016, pp. 770–778',
      scope: String.raw`The bars are the paper's reported numbers (Table 2: top-1 error, 10-crop testing, ImageNet validation set; Table 6: CIFAR-10 test error, with data augmentation). The curves are our toy model, not the paper's measurements.`,
      links: { arxiv: 'https://arxiv.org/abs/1512.03385', doi: 'https://doi.org/10.1109/CVPR.2016.90' },
      viz(v) {
        const shortS = v.toggle('add identity shortcuts', true);
        const tabS = v.select('paper numbers', [{ value: 'imagenet', label: 'ImageNet (Table 2)' }, { value: 'cifar', label: 'CIFAR-10 (Table 6)' }], 'imagenet');
        const seedS = v.slider('seed', 1, 9, 5, { int: true });
        const STEPS = 400, tr = toyData('spiral', 90, { noise: 0.12, seed: 3 }), te = toyData('spiral', 400, { noise: 0.12, seed: 9 });
        const sE = v.stage({ x: [0, STEPS], y: [0, 0.55], height: 320, axes: 'box', gutter: true, xlabel: 'training step', ylabel: 'training error', weight: 1, minWidth: 250, title: 'training error (toy)' });
        const sT = v.stage({ x: [0, STEPS], y: [0, 0.55], height: 320, axes: 'box', gutter: true, xlabel: 'training step', ylabel: 'test error', weight: 1, minWidth: 250, title: 'test error (toy)' });
        const sB = v.stage({ x: [0, 5], y: [0, 36], height: 320, axes: 'box', gutter: true, ylabel: 'error (%)', weight: 1, minWidth: 250, title: 'the paper\'s numbers' });
        const cfgOf = (sd) => [{ name: 'plain-20', H: 20, seed: sd }, { name: 'plain-56', H: 56, seed: sd }, { name: 'ResNet-20', H: 20, residual: true, seed: sd }, { name: 'ResNet-56', H: 56, residual: true, seed: sd }];
        const cols = ['orange', 'red', 'accent', 'green'];
        let seedKey = seedS.value;
        const S = v.sim(() => makeRace(cfgOf(seedS.value), tr, te, { maxSteps: STEPS }), (R) => { R.step(); R.step(); }, { dt: 1 / 60 });
        const IMG = [['plain-18', 27.94, 'orange'], ['ResNet-18', 27.88, 'accent'], ['plain-34', 28.54, 'red'], ['ResNet-34', 25.03, 'green']];
        const CIF = [['20', 8.75], ['32', 7.51], ['44', 7.17], ['56', 6.97], ['110', 6.43], ['1202', 7.93]];
        let info = null;
        v.animate((t) => {
          if (seedS.value !== seedKey) { seedKey = seedS.value; S.reset(); if (v.playing) v.restart(); }
          const R = S.advance(t), sh = shortS.value;
          R.runs.forEach((r, i) => {
            const res = i >= 2; if (res && !sh) return;
            sE.path(r.hist.err.map((y, k) => [k, y]), { color: cols[i], width: res ? 2.6 : 1.5, alpha: res ? 1 : 0.85 });
            sT.path(r.hist.test.map(([k, y]) => [k, y]), { color: cols[i], width: res ? 2.6 : 1.5, alpha: res ? 1 : 0.85 });
          });
          for (const s of [sE, sT]) s.hline(0.5, { color: 'faint', dash: true });
          if (tabS.value === 'imagenet') {
            sB.setView([0, 4.4], [0, 34]); sB.setTicks([[0.4, 'plain-18'], [1.4, 'ResNet-18'], [2.8, 'plain-34'], [3.8, 'ResNet-34']], null); sB.setLabels(undefined, 'top-1 error (%)');
            [[0.4, 27.94, 'orange'], [1.4, 27.88, 'accent'], [2.8, 28.54, 'red'], [3.8, 25.03, 'green']].forEach(([x, y, c]) => { sB.rect(x - 0.4, 0, x + 0.4, y, { fill: c, fillAlpha: 0.55, color: c, width: 1.2 }); sB.text(y.toFixed(2), x, y, { align: 'center', baseline: 'bottom', dy: -4, size: 12, color: 'ink' }); });
          } else {
            sB.setView([0, 6], [5, 9.5]); sB.setTicks(CIF.map((c, i) => [i + 0.5, c[0]]), null); sB.setLabels('ResNet depth', 'test error (%)');
            CIF.forEach(([n, y], i) => { const c = n === '1202' ? 'red' : 'accent'; sB.rect(i + 0.12, 5, i + 0.88, y, { fill: c, fillAlpha: 0.55, color: c, width: 1.2 }); sB.text(y.toFixed(2), i + 0.5, y, { align: 'center', baseline: 'bottom', dy: -4, size: 12, color: 'ink' }); });
          }
          info = { st: R.steps, runs: R.runs.map((r) => ({ tr: last(r.hist.err) ?? NaN, te: last(r.hist.test)?.[1] ?? NaN })) };
        }, { period: 7.4, once: true, still: 7.4 });
        v.legend([['orange', 'plain 20'], ['red', 'plain 56'], ['accent', 'with shortcuts 20'], ['green', 'with shortcuts 56']]);
        v.readout(() => info && String.raw`toy model, step ${info.st}: training error plain-20 ${pct(info.runs[0].tr)}, plain-56 **${pct(info.runs[1].tr)}** · with shortcuts ${shortS.value ? `ResNet-20 ${pct(info.runs[2].tr)}, ResNet-56 **${pct(info.runs[3].tr)}**` : '(switched off)'}` + `\n` +
          (tabS.value === 'imagenet' ? `paper, ImageNet (top-1 validation): going from 18 to 34 layers *raises* the plain error 27.94 → 28.54 and *lowers* the ResNet error 27.88 → 25.03` : `paper, CIFAR-10: error falls with depth from 8.75% (20 layers) to 6.43% (110), and rises again to 7.93% at 1202 layers (which the authors attribute to overfitting on a small data set); the paper's ensemble on the ImageNet test set reaches 3.57% top-5 error`));
      },
    },
  ],
};
