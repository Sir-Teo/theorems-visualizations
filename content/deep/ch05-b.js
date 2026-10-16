// Deep Learning Theory — Chapter 5: Depth, initialization and normalization (items 5.6–5.9; 5.1–5.5 in ch05.js, 5.10–5.13 in ch05-c.js)
//
// Items 5.6, 5.7 and 5.9 train real deep multilayer perceptrons (the DNet engine of ch05.shared.js, with analytic
// backpropagation through skips and batch normalization, checked against finite differences) on a two-armed spiral, live in the page. The
// numbers on screen are measured on those runs: a toy-scale model of the phenomena, not the CIFAR/ImageNet experiments of the papers.
import { clamp, mnus, memo, rand, hashStr, toyData, makeRace, makeDNet, dnetRun, dnetStep, dnetProb, regionRaster, drawPoints, rampLUT } from './ch05.shared.js';

const TR = () => toyData('spiral', 120, { noise: 0.12, seed: 3 });
const TE = () => toyData('spiral', 400, { noise: 0.12, seed: 9 });
const pct = (x) => (100 * x).toFixed(0) + '%';
const last = (a) => a[a.length - 1];

export default {
  collection: 'deep',
  chapter: 5,
  items: [
    // ───────────────────────────────────────────────────────────── 5.6
    {
      num: '5.6',
      kind: 'Phenomenon',
      name: 'Degradation of plain deep networks',
      statement: String.raw`Let $\mathcal F_d$ be the class of plain feedforward networks of depth $d$ (no skip connections). With ReLU units, $\mathcal F_{d}\subseteq\mathcal F_{d+1}$ on non-negative inputs: any extra layer can be set to the identity, $h\mapsto\max(0,Ih)=h$, so a deeper network can do whatever a shallower one can, and its **training** error at the global optimum is no larger. In practice, for stochastic gradient descent from a standard initialization, the opposite is observed beyond a moderate depth: **adding layers to a plain network raises the training error** (and with it the test error). This *degradation* is not overfitting, because the training error itself is higher; it is an optimization failure that appears even when vanishing and exploding signals have been tamed by careful initialization or normalization.`,
      idea: String.raw`The deeper plain network contains the shallower solution (extra layers equal to the identity), yet gradient descent does not find it: a randomly initialized stack of layers is far from the identity, and learning each extra layer to be close to it is hard. He et al. (2015) reported the effect on CIFAR-10 and on ImageNet (34-layer plain nets worse than 18-layer ones, Table 2 of the paper) and used it to motivate the residual parametrization of 5.7, in which the identity is the starting point rather than a delicate special case. Exploding or vanishing gradients (5.1) are one cause of slow training, but the paper observed the degradation with batch normalization and proper initialization in place, so they are not the whole story.`,
      caption: String.raw`Three plain tanh networks of depth 5, 20 and 50 (width 10, Xavier initialization) are trained by the same full-batch SGD with momentum on the same 120 points of a two-armed spiral; 400 fresh points measure the test error. Left: training error; middle: test error; right: the decision regions of the selected network. The deeper nets are worse **on the training set**, so this is not overfitting. This is a toy-scale reproduction of the phenomenon (the paper's own figure used CIFAR-10 and ResNet-style plain nets), and with other learning rates or with batch normalization the 20-layer net can be rescued — which is the point: it is a difficulty of optimization, not of capacity.`,
      deps: ['deep-5.1'],
      refs: ['Prince §11.1'],
      tags: ['depth', 'optimization', 'degradation'],
      credit: 'He, Zhang, Ren & Sun, 2015 (arXiv; CVPR 2016)',
      scope: String.raw`An empirical regularity for plain networks trained by SGD, not a theorem; its size depends on architecture, initialization, normalization and learning rate.`,
      links: { arxiv: 'https://arxiv.org/abs/1512.03385' },
      viz(v) {
        const showS = v.select('show decision regions of', [{ value: 0, label: 'depth 5' }, { value: 1, label: 'depth 20' }, { value: 2, label: 'depth 50' }], 2);
        const STEPS = 400, tr = TR(), te = TE();
        const cfgs = [{ name: 'depth 5', H: 5 }, { name: 'depth 20', H: 20 }, { name: 'depth 50', H: 50 }], cols = ['green', 'orange', 'red'];
        const sE = v.stage({ x: [0, STEPS], y: [0, 0.55], height: 320, axes: 'box', gutter: true, xlabel: 'training step', ylabel: 'training error', weight: 1, minWidth: 250, title: 'training error' });
        const sT = v.stage({ x: [0, STEPS], y: [0, 0.55], height: 320, axes: 'box', gutter: true, xlabel: 'training step', ylabel: 'test error', weight: 1, minWidth: 250, title: 'test error (400 fresh points)' });
        const sM = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 320, axes: 'box', gutter: true, weight: 0.9, minWidth: 250, title: 'decision regions' });
        const S = v.sim(() => makeRace(cfgs, tr, te, { maxSteps: STEPS }), (R) => { R.step(); R.step(); }, { dt: 1 / 60 });
        let info = null, mapKey = '';
        v.animate((t) => {
          const R = S.advance(t); const st = R.steps;
          R.runs.forEach((r, i) => {
            const e = r.hist.err; sE.path(e.map((y, k) => [k, y]), { color: cols[i], width: 2 });
            sT.path(r.hist.test.map(([k, y]) => [k, y]), { color: cols[i], width: 2 });
          });
          for (const s of [sE, sT]) s.hline(0.5, { color: 'faint', dash: true });
          const sel = showS.value, net = R.runs[sel].net, key = sel + '|' + Math.floor(st / 40) + '|' + (st >= STEPS ? 'f' : '');
          regionRaster(sM, v, (x, y) => dnetProb(net, [x, y]), { key, res: 5 });
          drawPoints(sM, tr, { r: 3.4 });
          info = R.runs.map((r, i) => ({ name: cfgs[i].name, tr: last(r.hist.err) ?? NaN, te: last(r.hist.test)?.[1] ?? NaN })); info.st = st;
        }, { period: 5.2, once: true, still: 5.2 });
        v.legend([['green', 'depth 5'], ['orange', 'depth 20'], ['red', 'depth 50'], ['faint', 'chance (50%)', { dash: true }]]);
        v.readout(() => info && String.raw`step ${info.st}: training error ` + info.map((x, i) => `**${x.name}: ${pct(x.tr)}**`).join(' · ') + `\n` + `test error ` + info.map((x) => `${x.name}: ${pct(x.te)}`).join(' · ') +
          (info.st >= 400 ? ` · the deeper the net, the *higher* the training error: degradation, not overfitting` : ''));
      },
    },
    // ───────────────────────────────────────────────────────────── 5.7
    {
      num: '5.7',
      kind: 'Model',
      name: 'Residual networks',
      statement: String.raw`A **residual block** adds its input back to its output: $h_{l+1}=h_l+F_l(h_l)$, where $F_l$ is a small stack of layers (here one affine map and a nonlinearity). A residual network stacks $L$ such blocks (the skip connection is the identity whenever the dimensions match). Unrolling the recursion,
$$\frac{\partial\ell}{\partial h_l}=\Bigl(\prod_{k=l}^{L-1}\bigl(I+J_{F_k}\bigr)\Bigr)^{\!\top}\frac{\partial\ell}{\partial h_L},\qquad J_{F_k}=\frac{\partial F_k}{\partial h},$$
and the expansion of the product contains the term $I$: the output gradient reaches every layer **unattenuated**, plus corrections that involve the branches. The network $h_L$ is likewise a sum of the input and $L$ branch outputs, and when every $F_l\equiv0$ it is the identity, the natural starting point for training.`,
      idea: String.raw`Because the identity is built into the architecture, a block only has to learn the *residual* $F_l=h_{l+1}-h_l$, which is near zero if the identity is nearly optimal (5.6), and the gradient has an identity path from the loss to every layer, so the product of Jacobians of 5.1 becomes $\prod(I+J_k)$, whose singular values stay near 1 when the $J_k$ are small. Veit, Wilber and Belongie (2016) showed that this makes a residual network behave like an ensemble of many shallow paths. Residual branches here are initialized with a smaller scale (about $1.2/\sqrt L$ times the usual gain), in the same spirit as the zero-initialization of the last layer of each block used in practice.`,
      caption: String.raw`A plain and a residual tanh network, both with 30 layers (width 10), trained from the same seed on the spiral of 5.6. Left: training loss (log scale). Middle: the rms of the gradient $\partial\ell/\partial h_l$ at each layer, input at the left: at initialization (dashed) the residual network's is flat across all 30 layers while the plain one loses about an order of magnitude towards the input; solid lines are the current step (once a network has fitted the data its gradients are small everywhere). Right: decision regions of the chosen network. The residual run is not tuned and shows loss spikes early in training.`,
      deps: ['deep-5.6'],
      see: ['deep-5.13'],
      refs: ['Prince §11.2', 'Prince §11.3'],
      tags: ['skip connections', 'residual', 'gradients'],
      credit: 'He, Zhang, Ren & Sun, 2015 (arXiv; CVPR 2016)',
      scope: String.raw`The unattenuated-gradient statement is exact for the unrolled identity term; how much the branch terms add or cancel depends on the weights, so the benefit is an empirical one that is largest for small residual branches.`,
      links: { arxiv: 'https://arxiv.org/abs/1512.03385' },
      viz(v) {
        const showS = v.select('decision regions of', [{ value: 0, label: 'plain' }, { value: 1, label: 'residual' }], 1);
        const STEPS = 400, H = 30, tr = TR(), te = TE();
        const cfgs = [{ name: 'plain', H }, { name: 'residual', H, residual: true }];
        const sL = v.stage({ x: [0, STEPS], y: [1e-3, 8], ylog: true, height: 320, axes: 'box', gutter: true, xlabel: 'training step', ylabel: 'training loss', weight: 1, minWidth: 250, title: 'training loss' });
        const sG = v.stage({ x: [0, H - 1], y: [1e-4, 1e2], ylog: true, height: 320, axes: 'box', gutter: true, xlabel: 'layer $l$ (input 0 → output)', ylabel: 'gradient rms', weight: 1.05, minWidth: 260, title: 'gradient at each layer' });
        const sM = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 320, axes: 'box', gutter: true, weight: 0.85, minWidth: 240, title: 'decision regions' });
        const S = v.sim(() => makeRace(cfgs, tr, te, { maxSteps: STEPS }), (R) => { R.step(); R.step(); }, { dt: 1 / 60 });
        let info = null;
        v.animate((t) => {
          const R = S.advance(t), st = R.steps, cols = ['red', 'accent'];
          R.runs.forEach((r, i) => {
            sL.path(r.hist.loss.map((y, k) => [k, Math.max(1e-3, y)]), { color: cols[i], width: 2 });
            if (r.gn) {
              sG.path(Array.from(r.gn0.slice(0, H), (x, l) => [l, x]), { color: cols[i], dash: true, width: 1.2, alpha: 0.7 });
              sG.path(Array.from(r.gn.slice(0, H), (x, l) => [l, Math.max(1e-4, x)]), { color: cols[i], width: 2.2 });
            }
          });
          sL.hline(Math.log(2), { color: 'faint', dash: true });
          const sel = showS.value, net = R.runs[sel].net, key = sel + '|' + Math.floor(st / 40) + '|' + (st >= STEPS ? 'f' : '');
          regionRaster(sM, v, (x, y) => dnetProb(net, [x, y]), { key, res: 5 });
          drawPoints(sM, tr, { r: 3.4 });
          info = R.runs.map((r) => ({ loss: last(r.hist.loss) ?? NaN, err: last(r.hist.err) ?? NaN, te: last(r.hist.test)?.[1] ?? NaN, i0: r.gn0 ? r.gn0[0] : NaN, iL: r.gn0 ? r.gn0[H - 1] : NaN, g0: r.gn ? r.gn[0] : NaN, gL: r.gn ? r.gn[H - 1] : NaN })); info.st = st;
        }, { period: 5.2, once: true, still: 5.2 });
        v.legend([['red', 'plain 30 layers'], ['accent', 'residual 30 layers'], ['faint', 'dashed: gradient at initialization · loss ln 2 (chance)', { dash: true }]]);
        const ratio = (a, b) => (isFinite(a) && b > 0 ? (a / b).toPrecision(2) : '—');
        v.readout(() => info && String.raw`step ${info.st}: training error **plain ${pct(info[0].err)}**, **residual ${pct(info[1].err)}** · test error ${pct(info[0].te)} / ${pct(info[1].te)}` + `\n` +
          `gradient at layer 0 divided by gradient at layer ${H - 1}: at initialization plain ${ratio(info[0].i0, info[0].iL)}, residual ${ratio(info[1].i0, info[1].iL)} · now plain ${ratio(info[0].g0, info[0].gL)}, residual ${ratio(info[1].g0, info[1].gL)}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 5.8
    {
      num: '5.8',
      kind: 'Concept',
      name: 'Residual networks as discretized ODEs',
      statement: String.raw`A residual stack with $L$ blocks of step $1/L$,
$$h_{l+1}=h_l+\tfrac1L\,f\!\bigl(h_l,\tfrac lL;\theta\bigr),\qquad l=0,\dots,L-1,$$
is the **forward Euler** discretization, with step $1/L$, of the ordinary differential equation $\dot x(t)=f(x(t),t;\theta)$ on $t\in[0,1]$. If $f$ is Lipschitz in $x$ (and $\theta(t)$ varies continuously with $t$), the ODE has a unique flow $\Phi_{0\to1}$ (ode-2.4), and Euler's method converges to it at first order: $\max_i\|h_L(x_i)-\Phi_{0\to1}(x_i)\|\le C/L$. The depth $L$ is thus the number of time steps, a residual network is a numerical integration of a learned vector field, and the map from inputs to outputs of a very deep, smoothly varying residual network is a **flow map** (a homeomorphism: invertible and continuous in both directions), not an arbitrary function.`,
      idea: String.raw`Rewrite $h_{l+1}-h_l=\frac1L f(h_l,t_l)$ as a difference quotient; Euler's polygon converges to the solution of the integral equation $x(t)=x_0+\int_0^tf(x(s),s)\,ds$ as the step shrinks, which is the constructive existence proof (ode-2.10), and Gronwall's inequality controls the local errors $O(1/L^2)$ accumulated over $L$ steps into a global $O(1/L)$. Weinan E (2017) and Haber & Ruthotto (2017) proposed reading deep learning as optimal control of such flows, and Chen et al. (2018) replaced the fixed Euler steps by an adaptive ODE solver with the adjoint method for gradients ("neural ODEs"). Real ResNets do not scale their branches by $1/L$ and use different weights in each block, so the ODE is an interpretation that becomes literal only in this scaled limit.`,
      caption: String.raw`An untrained, fixed smooth time-dependent vector field $f$ (a random one-hidden-layer tanh field, amplitude adjustable) moves 48 points of two moons. Each coloured polyline is the path of a point through the $L$ layers of the residual stack; the grey curves are the exact flow (RK4 with 400 steps), the hollow rings its endpoints. Right: the mean endpoint error against $L$ on log–log axes: it falls with slope $-1$ (dashed), the first-order convergence of Euler's method. Increase the amplitude to make the flow stiffer and the error larger at every $L$.`,
      deps: ['deep-5.7', 'ode-2.10', 'ode-2.4'],
      refs: ['Prince §11'],
      tags: ['ODE', 'Euler method', 'flows'],
      credit: 'W. E, 2017; Haber & Ruthotto, 2017; Chen, Rubanova, Bettencourt & Duvenaud, 2018',
      scope: String.raw`Literal for residual networks of the form $h+\frac1Lf$ with smoothly varying weights; for standard ResNets (no $1/L$ scaling, independent weights per block) it is a heuristic picture. The vector field in the picture is random, not trained.`,
      verify: true,
      links: { arxiv: 'https://arxiv.org/abs/1806.07366' },
      viz(v) {
        const Ls = v.slider('layers $L$ (steps of size $1/L$)', 1, 128, 4, { log: true, int: true });
        const aS = v.slider('field amplitude', 0.5, 3, 1.1, { step: 0.05 });
        const showODE = v.toggle('show exact flow', true);
        const sM = v.stage({ x: [-4.4, 4.4], y: [-3.1, 3.1], equal: true, height: 360, axes: false, weight: 1.15, minWidth: 300, title: 'points moved by the residual stack' });
        const sE = v.stage({ x: [1, 128], y: [1e-4, 10], xlog: true, ylog: true, height: 360, axes: 'box', gutter: true, xlabel: 'layers $L$', ylabel: 'mean endpoint error', weight: 0.85, minWidth: 260, title: 'convergence to the flow' });
        const r = rand(hashStr('resode')), H = 6;
        const W1 = Array.from({ length: H }, () => [r.normal() * 1.1, r.normal() * 1.1]), bb = Array.from({ length: H }, () => r.normal() * 0.8), wt = Array.from({ length: H }, () => r.normal() * 1.3);
        const W2 = Array.from({ length: 2 }, () => Array.from({ length: H }, () => r.normal() * 0.55));
        const field = (x, y, t, a) => { let u = 0, w = 0; for (let j = 0; j < H; j++) { const th = Math.tanh(W1[j][0] * x + W1[j][1] * y + wt[j] * (t - 0.5) + bb[j]); u += W2[0][j] * th; w += W2[1][j] * th; } return [a * u, a * w]; };
        const D = toyData('moons', 48, { noise: 0.07, seed: 2 }), P0 = D.X.map(([x, y]) => [x * 1.35, y * 1.35]);
        const euler = (p, L, a, keep) => { let x = p[0], y = p[1]; const tr = keep ? [[x, y]] : null; for (let l = 0; l < L; l++) { const [u, w] = field(x, y, l / L, a); x += u / L; y += w / L; if (keep) tr.push([x, y]); } return keep ? tr : [x, y]; };
        const rk4 = (p, a, n = 400, keep = 0) => { let x = p[0], y = p[1]; const h = 1 / n, tr = keep ? [[x, y]] : null; for (let k = 0; k < n; k++) { const t = k * h, k1 = field(x, y, t, a), k2 = field(x + 0.5 * h * k1[0], y + 0.5 * h * k1[1], t + 0.5 * h, a), k3 = field(x + 0.5 * h * k2[0], y + 0.5 * h * k2[1], t + 0.5 * h, a), k4 = field(x + h * k3[0], y + h * k3[1], t + h, a); x += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); if (keep && (k + 1) % keep === 0) tr.push([x, y]); } return keep ? tr : [x, y]; };
        const mc = memo(); const LS = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128];
        let info = null;
        v.render(() => {
          const L = Ls.value, a = aS.value;
          const ref = mc('ref' + a, () => { const ex = P0.map((p) => rk4(p, a, 400)), tr = P0.map((p) => rk4(p, a, 400, 10)); const err = LS.map((l) => P0.reduce((s, p, i) => { const q = euler(p, l, a, false); return s + Math.hypot(q[0] - ex[i][0], q[1] - ex[i][1]); }, 0) / P0.length); return { ex, tr, err }; });
          sM.field((x, y) => field(x, y, 0.5, a), { spacing: 44, color: 'faint', alpha: 0.55 });
          if (showODE.value) ref.tr.forEach((tr) => sM.path(tr, { color: 'muted', width: 1.1, alpha: 0.55 }));
          let err = 0;
          P0.forEach((p, i) => {
            const tr = euler(p, L, a, true), c = D.Y[i] ? 'orange' : 'accent';
            sM.path(tr, { color: c, width: 1.5, alpha: 0.9 });
            if (L <= 24) sM.dots(tr.slice(1, -1), { r: 2.2, color: c, alpha: 0.8 });
            const e = tr[tr.length - 1]; sM.dot(e[0], e[1], { r: 3.8, color: c });
            sM.dot(ref.ex[i][0], ref.ex[i][1], { r: 4.6, hollow: true, color: 'ink', width: 1.1, alpha: 0.7 });
            err += Math.hypot(e[0] - ref.ex[i][0], e[1] - ref.ex[i][1]);
            sM.dot(p[0], p[1], { r: 2.2, color: 'muted' });
          });
          err /= P0.length;
          sE.path(LS.map((l, i) => [l, ref.err[i]]), { color: 'accent', width: 2 }); sE.dots(LS.map((l, i) => [l, ref.err[i]]), { r: 3, color: 'accent' });
          sE.path([[1, ref.err[0]], [128, ref.err[0] / 128]], { color: 'muted', dash: true, width: 1.3 });
          sE.dot(L, err, { r: 6, color: 'gold' });
          info = { L, err, e1: ref.err[0], e128: ref.err[LS.length - 1] };
        });
        v.legend([['accent', 'one class, through the layers'], ['orange', 'other class'], ['ink', 'ring: end of the exact flow', { dot: true }], ['muted', 'dashed: slope −1 (first order)', { dash: true }]]);
        v.readout(() => info && String.raw`$L=${info.L}$ layers (step $1/L=${v.fix(1 / info.L, 3)}$): mean distance of the endpoints from the exact flow's = **${v.fix(info.err, 4)}**` + `\n` + `from $L=1$ to $L=128$ the error falls from ${v.fix(info.e1, 3)} to ${v.fix(info.e128, 4)}, a factor ${v.fix(info.e1 / info.e128, 0)} for 128 times more layers — first order, as Euler's method predicts`);
      },
    },
    // ───────────────────────────────────────────────────────────── 5.9
    {
      num: '5.9',
      kind: 'Method',
      name: 'Batch normalization',
      statement: String.raw`For a mini-batch $\mathcal B$ of $m$ examples, **batch normalization** replaces each unit's pre-activation $z$ by
$$\hat z=\frac{z-\mu_{\mathcal B}}{\sqrt{\sigma^2_{\mathcal B}+\epsilon}},\qquad y=\gamma\,\hat z+\beta,$$
with $\mu_{\mathcal B},\sigma_{\mathcal B}^2$ the mean and variance of that unit over the batch and $\gamma,\beta$ learned per unit (so the layer can restore any mean and scale it needs). Gradients are propagated through $\mu_{\mathcal B}$ and $\sigma_{\mathcal B}$. At test time running averages of the training statistics replace the batch statistics. By construction $\hat z$ has batch mean 0 and variance 1 whatever the weights below it are doing; the method is undefined for $m=1$ (then $\hat z\equiv0$) and noisy for small $m$, because the statistics of $m$ samples fluctuate by about $\sigma/\sqrt m$.`,
      idea: String.raw`Standardizing every unit's input removes the drift in scale and offset that earlier layers cause as they change, and keeps units in the responsive range of the nonlinearity; Ioffe and Szegedy (2015) attributed the benefit to reduced *internal covariate shift* and reported reaching the same accuracy with 14 times fewer training steps. Later work questions that explanation: Santurkar et al. (2018) found that normalization makes the loss and its gradients smoother (better conditioned) even when covariate shift is injected artificially, and the scale invariance it creates (5.10) changes the effective learning rate. The batch-size dependence also has a cost: examples in a batch are no longer processed independently, which motivates layer normalization (5.11).`,
      caption: String.raw`Two 4-hidden-layer tanh networks (width 16) are trained from the same initialization on the same minibatch sequence, one without normalization and one with batch normalization; we watch one unit of the third layer. Left: histogram of its input to the activation at the chosen training step: without normalization (red) the distribution wanders in location and width as the layers below change, with batch norm (blue) it is standardized to mean 0 and variance 1 (the standard normal is the green curve; the histogram of 160 points is only roughly Gaussian). Middle: its mean and ±1 standard deviation over training (orange: the batch-norm net's unit before normalizing, which wanders too). Right: the trained batch-norm net evaluated with test batches of $B$ examples normalized by their own statistics: accuracy collapses to chance at $B=1$ and is noisy for small $B$; running statistics (green) fix it. Choose the training batch size to see how noise in $\mu_{\mathcal B},\sigma_{\mathcal B}$ matters; at 1 the batch-norm network cannot learn at all (the unnormalized one also struggles at this step size).`,
      deps: ['deep-5.1'],
      refs: ['Prince §11.4', 'Goodfellow §8.7'],
      tags: ['normalization', 'batch statistics', 'training speed'],
      credit: 'Ioffe & Szegedy, 2015',
      scope: String.raw`The standardization is exact by construction; its benefit for training speed is empirical, and the *explanation* (internal covariate shift versus smoothing of the loss) is still debated. Needs batches of more than a few examples drawn i.i.d.; for sequences or small batches layer normalization (5.11) is used instead.`,
      links: { arxiv: 'https://arxiv.org/abs/1502.03167' },
      viz(v) {
        const bS = v.select('training batch size', [1, 4, 16, 64].map((b) => ({ value: b, label: String(b) })), 16);
        const stepS = v.slider('training step', 0, 400, 400, { step: 10, int: true });
        const seed = { v: 1 }; v.button('new initialization', () => { seed.v++; });
        const tr = toyData('spiral', 160, { noise: 0.12, seed: 3 }), te = toyData('spiral', 256, { noise: 0.12, seed: 9 }), STEPS = 400, LAY = 2;
        const sH = v.stage({ x: [-4, 4], y: [0, 1.2], height: 320, axes: 'box', gutter: true, xlabel: 'input of the activation', ylabel: 'density', weight: 1, minWidth: 250, title: 'one unit, layer 3' });
        const sT = v.stage({ x: [0, STEPS], y: [-3.2, 3.2], height: 320, axes: 'box', gutter: true, xlabel: 'training step', ylabel: 'mean ± 1 std', weight: 1, minWidth: 250, title: 'its distribution during training' });
        const sA = v.stage({ x: [1, 256], y: [0.4, 1.03], xlog: true, height: 320, axes: 'box', gutter: true, xlabel: 'test batch size $B$', ylabel: 'accuracy', weight: 0.9, minWidth: 240, title: 'batch norm at test time' });
        const mc = memo();
        function experiment(B, sd) {
          const raw = makeDNet({ H: 4, width: 16, act: 'tanh', seed: 4 + sd }), bn = makeDNet({ H: 4, width: 16, act: 'tanh', seed: 4 + sd, bn: true });
          const r = rand(hashStr('bnb' + B + '|' + sd)), snaps = [], n = tr.X.length;
          const col = (arr, k, dim) => Array.from({ length: n }, (_, i) => arr[i * dim + k]);
          const stats = (a) => { const m = a.reduce((x, y) => x + y, 0) / a.length, s = Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length); return [m, s]; };
          for (let s = 0; s <= STEPS; s++) {
            if (s % 10 === 0) {
              dnetRun(raw, tr.X, tr.Y, false); const zr = col(raw._wsm[n].Z[LAY], 0, 16);
              dnetRun(bn, tr.X, tr.Y, false); const w = bn._wsm[n], zb = col(w.Z[LAY], 0, 16), zh = col(w.Zh[LAY], 0, 16), yb = col(w.Pre[LAY], 0, 16);
              snaps.push({ zr, zh, zb, yb, sr: stats(zr), sh: stats(zh), sb: stats(zb), sy: stats(yb) });
            }
            if (s === STEPS) break;
            const idx = Array.from({ length: B }, () => Math.floor(r() * n)), Xb = idx.map((i) => tr.X[i]), Yb = idx.map((i) => tr.Y[i]);
            for (const net of [raw, bn]) { dnetRun(net, Xb, Yb, true); dnetStep(net, 0.05, 0.9); }
          }
          // running statistics of the batch-norm net from the whole training set
          dnetRun(bn, tr.X, tr.Y, false); const w = bn._wsm[n]; bn.runMu = w.mu.map((a) => Float64Array.from(a)); bn.runVar = w.sd.map((a) => Float64Array.from(a, (x) => x * x - 1e-5));
          const accB = []; const rr = rand(7), order = Array.from({ length: te.X.length }, (_, i) => i);
          for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rr() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
          for (const Be of [1, 2, 4, 8, 16, 32, 64, 128, 256]) {
            let ok = 0, tot = 0;
            for (let s = 0; s + Be <= order.length; s += Be) { const ix = order.slice(s, s + Be), o = dnetRun(bn, ix.map((i) => te.X[i]), ix.map((i) => te.Y[i]), false, true); ok += o.acc * Be; tot += Be; }
            accB.push([Be, ok / tot]);
          }
          const accRun = dnetRun(bn, te.X, te.Y, false, false).acc, accRaw = dnetRun(raw, te.X, te.Y, false).acc;
          return { snaps, accB, accRun, accRaw };
        }
        let info = null;
        v.render(() => {
          const B = bS.value, E = mc(B + '|' + seed.v, () => experiment(B, seed.v)), k = stepS.value / 10, S = E.snaps[k];
          sH.fn((x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI), { color: 'green', dash: true, width: 1.6 });
          const dmax = (a) => { const c = new Array(32).fill(0); for (const x of a) if (x >= -4 && x < 4) c[Math.floor((x + 4) * 4)]++; return Math.max(...c) / (a.length * 0.25); };
          sH.setView([-4, 4], [0, Math.max(0.6, 1.1 * Math.max(dmax(S.zr), dmax(S.zh)))]);
          sH.hist(S.zr, { bins: 32, range: [-4, 4], density: true, color: 'red', fillAlpha: 0.2, outline: true });
          sH.hist(S.zh, { bins: 32, range: [-4, 4], density: true, color: 'accent', fillAlpha: 0.22, outline: true });
          const band = (key, col, a) => { const up = E.snaps.map((s, i) => [i * 10, s[key][0] + s[key][1]]), lo = E.snaps.map((s, i) => [i * 10, s[key][0] - s[key][1]]); sT.poly([...up, ...lo.reverse()], { fill: col, fillAlpha: a, stroke: false }); sT.path(E.snaps.map((s, i) => [i * 10, s[key][0]]), { color: col, width: 2 }); };
          band('sr', 'red', 0.13); band('sb', 'orange', 0.1); band('sh', 'accent', 0.16);
          sT.vline(stepS.value, { color: 'gold', width: 1.6 });
          sA.hline(E.accRaw, { color: 'red', dash: true, width: 1.4 }); sA.hline(E.accRun, { color: 'green', dash: true, width: 1.6 }); sA.hline(0.5, { color: 'faint', dash: true });
          sA.path(E.accB, { color: 'accent', width: 2.2 }); sA.dots(E.accB, { r: 3.6, color: 'accent' });
          info = { S, B, accB1: E.accB[0][1], accRun: E.accRun, accRaw: E.accRaw };
        });
        v.legend([['red', 'no normalization: unit input'], ['orange', 'batch-norm net: before normalizing'], ['accent', 'after normalizing $\\hat z$'], ['green', 'standard normal / running stats', { dash: true }]]);
        v.readout(() => info && String.raw`step ${stepS.value}: raw net mean ${mnus(v.fix(info.S.sr[0], 2))}, std ${v.fix(info.S.sr[1], 2)} · batch-norm net: before ${mnus(v.fix(info.S.sb[0], 2))} / ${v.fix(info.S.sb[1], 2)}, after normalizing **${mnus(v.fix(info.S.sh[0], 2))} / ${v.fix(info.S.sh[1], 2)}** (always 0 / 1)` + `\n` +
          `test accuracy: unnormalized net ${pct(info.accRaw)}; batch-norm net with running statistics ${pct(info.accRun)}, with test batches of 1 example ${pct(info.accB1)} (training batch ${info.B})`);
      },
    },
  ],
};
